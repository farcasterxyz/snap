import type { SnapHandlerResult, SnapSpec } from "@farcaster/snap";
import { DEFAULT_THEME_ACCENT, PALETTE_LIGHT_HEX } from "@farcaster/snap";
import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";

// ─── Public types ────────────────────────────────────────

export type OgFontSpec = {
  /** Absolute path to a .woff2 (or .woff / .ttf) file on disk. */
  path: string;
  weight: 400 | 700;
  style?: "normal" | "italic";
};

export type OgCacheAdapter = {
  get(key: string): Promise<{ png: Uint8Array; etag: string } | null>;
  set(
    key: string,
    value: { png: Uint8Array; etag: string },
    ttlSeconds: number,
  ): Promise<void>;
};

export type OgOptions = {
  /** OG image width in pixels. @default card width + outer margin (~508) */
  width?: number;
  /** OG image height in pixels. @default derived from snap content + margins */
  height?: number;
  /**
   * Font files to use for OG image rendering. Pass absolute disk paths to
   * woff2/ttf files. Falls back to a CDN-loaded Inter if omitted or unavailable.
   */
  fonts?: OgFontSpec[];
  /**
   * Optional distributed cache adapter (e.g. Upstash Redis).
   * When omitted the function relies entirely on CDN Cache-Control headers.
   */
  cache?: OgCacheAdapter;
  /** CDN s-maxage in seconds. @default 86400 */
  cdnMaxAge?: number;
  /** Browser max-age in seconds. @default 60 */
  browserMaxAge?: number;
};

/** Content width inside the OG card (`OG_CARD_OUTER_WIDTH_PX` − horizontal padding 24px×2). */
const OG_CARD_INNER_WIDTH_PX = 412;
/** White card width (border-box), matches in-app snap preview (~420px). */
const OG_CARD_OUTER_WIDTH_PX = 460;
/** Gray margin between PNG edge and card on all sides. */
const OG_OUTER_MARGIN_PX = 24;
const OG_CARD_PADDING_PX = 24;
const OG_ELEMENT_GAP_PX = 12;
const OG_BUTTONS_TOP_GAP_PX = 12;
/** Padding to avoid Yoga/Satori rounding clipping stacked content. */
const OG_HEIGHT_SAFETY_PX = 8;
const OG_MIN_HEIGHT_PX = 200;
const OG_MAX_HEIGHT_PX = 2400;

const DEFAULT_OG_WIDTH_PX = OG_CARD_OUTER_WIDTH_PX + 2 * OG_OUTER_MARGIN_PX;

// ─── ETag ────────────────────────────────────────────────

export function etagForPage(snapJson: string): string {
  let h = 0;
  for (let i = 0; i < snapJson.length; i++) {
    h = (Math.imul(31, h) + snapJson.charCodeAt(i)) | 0;
  }
  return `"snap-${(h >>> 0).toString(36)}"`;
}

// ─── Singleflight ─────────────────────────────────────────

const inflight = new Map<string, Promise<{ png: Uint8Array; etag: string }>>();

export async function renderWithDedup(
  key: string,
  render: () => Promise<{ png: Uint8Array; etag: string }>,
): Promise<{ png: Uint8Array; etag: string }> {
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = render().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

// ─── SSRF-safe image fetching ─────────────────────────────

const IMAGE_FETCH_TIMEOUT_MS = 3_000;
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

async function safeFetchImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const cl = res.headers.get("content-length");
    if (cl && parseInt(cl, 10) > IMAGE_MAX_BYTES) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > IMAGE_MAX_BYTES) return null;
    const mime = res.headers.get("content-type") ?? "image/png";
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i]!);
    return `data:${mime};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

// ─── Font loading ──────────────────────────────────────────

const fontCache = new Map<string, ArrayBuffer>();
// Satori requires TTF, OTF, or WOFF (v1). WOFF2 is not supported by its
// underlying opentype.js parser. @fontsource/inter v4 ships WOFF v1 files.
const CDN_FONT_URL_400 =
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.15/files/inter-latin-400-normal.woff";
const CDN_FONT_URL_700 =
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.15/files/inter-latin-700-normal.woff";
let cdnFontData400: ArrayBuffer | undefined;
let cdnFontData700: ArrayBuffer | undefined;

async function tryLoadFontFromPath(path: string): Promise<ArrayBuffer | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const cached = fontCache.get(path);
    if (cached) return cached;
    const buf = (await readFile(path)).buffer as ArrayBuffer;
    fontCache.set(path, buf);
    return buf;
  } catch {
    return null;
  }
}

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type FontStyle = "normal" | "italic";

type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: FontWeight;
  style: FontStyle;
};

async function buildFontList(
  specs: OgFontSpec[] | undefined,
): Promise<SatoriFont[]> {
  if (specs && specs.length > 0) {
    const fonts: SatoriFont[] = [];
    for (const spec of specs) {
      const data = await tryLoadFontFromPath(spec.path);
      if (data) {
        fonts.push({
          name: "Inter",
          data,
          weight: spec.weight as FontWeight,
          style: (spec.style ?? "normal") as FontStyle,
        });
      }
    }
    if (fonts.length > 0) return fonts;
  }
  // CDN fallback: Inter 400 + 700 so title/labels match the HTML card weights
  if (!cdnFontData400) {
    const res = await fetch(CDN_FONT_URL_400);
    if (!res.ok) throw new Error("Failed to load Inter 400 fallback from CDN");
    cdnFontData400 = await res.arrayBuffer();
  }
  if (!cdnFontData700) {
    const res = await fetch(CDN_FONT_URL_700);
    if (!res.ok) throw new Error("Failed to load Inter 700 fallback from CDN");
    cdnFontData700 = await res.arrayBuffer();
  }
  return [
    {
      name: "Inter",
      data: cdnFontData400,
      weight: 400 as FontWeight,
      style: "normal" as FontStyle,
    },
    {
      name: "Inter",
      data: cdnFontData700,
      weight: 700 as FontWeight,
      style: "normal" as FontStyle,
    },
  ];
}

// ─── resvg-wasm init ───────────────────────────────────────

let resvgInitPromise: Promise<void> | undefined;

async function ensureResvg(): Promise<void> {
  if (!resvgInitPromise) {
    // In Node.js, resolve wasm from node_modules to avoid network round-trip
    let wasmSource: Parameters<typeof initWasm>[0];
    try {
      const { readFile } = await import("node:fs/promises");
      const { createRequire } = await import("node:module");
      const req = createRequire(import.meta.url);
      const wasmPath = req.resolve("@resvg/resvg-wasm/index_bg.wasm");
      wasmSource = (await readFile(wasmPath)).buffer as ArrayBuffer;
    } catch {
      wasmSource = fetch(
        "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
      );
    }
    resvgInitPromise = initWasm(wasmSource);
  }
  await resvgInitPromise;
}

// ─── VNode helpers ─────────────────────────────────────────

type VNode = { type: string; props: Record<string, unknown> };
type Child = VNode | string | null | undefined;

function h(
  type: string,
  style: Record<string, unknown>,
  ...children: Child[]
): VNode {
  const kids = children.filter((c): c is VNode | string => c != null);
  const childValue =
    kids.length === 0 ? undefined : kids.length === 1 ? kids[0] : kids;
  return {
    type,
    props:
      childValue !== undefined ? { style, children: childValue } : { style },
  };
}

// ─── Element renderers ─────────────────────────────────────

type El = Record<string, unknown>;

function accentHex(accent: string | undefined): string {
  return (
    PALETTE_LIGHT_HEX[accent as keyof typeof PALETTE_LIGHT_HEX] ??
    PALETTE_LIGHT_HEX[DEFAULT_THEME_ACCENT]
  );
}

function colorHex(color: string | undefined, accent: string): string {
  if (!color || color === "accent") return accent;
  return PALETTE_LIGHT_HEX[color as keyof typeof PALETTE_LIGHT_HEX] ?? accent;
}

function mapText(el: El): VNode {
  const size = String(el.size ?? "md");
  const weight = String(el.weight ?? "normal");
  const align = (el.align as string) ?? "left";
  let content = String(el.content ?? "");
  content = content
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u27a1/gi, "->");
  const sizeStyles: Record<string, Record<string, unknown>> = {
    md: { fontSize: 15, lineHeight: 1.5 },
    sm: { fontSize: 13, lineHeight: 1.5 },
  };
  const weightStyles: Record<string, Record<string, unknown>> = {
    bold: { fontWeight: 700 },
    normal: { fontWeight: 400 },
  };
  return h(
    "div",
    {
      display: "flex",
      width: OG_CARD_INNER_WIDTH_PX,
      color: "#374151",
      textAlign: align,
      ...(sizeStyles[size] ?? sizeStyles.md),
      ...(weightStyles[weight] ?? weightStyles.normal),
    },
    content,
  );
}

function mapItem(el: El): VNode {
  const title = String(el.title ?? "");
  const description = el.description ? String(el.description) : undefined;
  return h(
    "div",
    { display: "flex", flexDirection: "column", gap: 2, padding: "6px 10px" },
    h("div", { display: "flex", fontSize: 15, fontWeight: 500, color: "#111" }, title),
    description
      ? h("div", { display: "flex", fontSize: 13, color: "#6B7280", lineHeight: 1.4 }, description)
      : null,
  );
}

function mapBadge(el: El, accent: string): VNode {
  const label = String(el.label ?? "");
  const color = colorHex(el.color as string | undefined, accent);
  const variant = String(el.variant ?? "default");
  const isFilled = variant === "default";
  const bg = isFilled ? color : "transparent";
  const fg = isFilled ? "#fff" : color;
  const border = isFilled ? undefined : `1px solid ${color}`;
  return h(
    "div",
    {
      display: "flex",
      alignItems: "center",
      paddingTop: 2, paddingBottom: 2, paddingLeft: 10, paddingRight: 10,
      borderRadius: 9999,
      fontSize: 12,
      fontWeight: 500,
      backgroundColor: bg,
      color: fg,
      ...(border ? { border } : {}),
    },
    label,
  );
}

function mapSeparator(): VNode {
  return h("div", {
    display: "flex",
    height: 1,
    backgroundColor: "#E5E7EB",
    width: "100%",
  });
}

function mapImage(el: El, imageMap: Map<string, string>): VNode {
  const url = el.url as string;
  const dataUri = imageMap.get(url);
  if (dataUri) {
    return h(
      "div",
      {
        display: "flex",
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
        width: "100%",
      },
      {
        type: "img",
        props: { src: dataUri, style: { width: "100%", objectFit: "cover" } },
      },
    );
  }
  return h(
    "div",
    {
      display: "flex",
      borderRadius: 8,
      backgroundColor: "#E5E7EB",
      height: 80,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    h("div", { display: "flex", fontSize: 12, color: "#9CA3AF" }, "image"),
  );
}

function mapDivider(): VNode {
  return h("div", {
    display: "flex",
    height: 1,
    backgroundColor: "#E5E7EB",
    width: "100%",
  });
}

function mapProgress(el: El, accent: string): VNode {
  const value = el.value as number;
  const max = el.max as number;
  const color = colorHex(el.color as string | undefined, accent);
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const labelNode = el.label
    ? h(
        "div",
        { display: "flex", fontSize: 13, color: "#6B7280" },
        String(el.label),
      )
    : null;
  return h(
    "div",
    { display: "flex", flexDirection: "column", gap: 4 },
    labelNode,
    h(
      "div",
      {
        display: "flex",
        height: 8,
        backgroundColor: "#E5E7EB",
        borderRadius: 4,
        overflow: "hidden",
        width: "100%",
      },
      h("div", {
        display: "flex",
        height: "100%",
        width: `${pct}%`,
        backgroundColor: color,
        borderRadius: 4,
      }),
    ),
  );
}

function mapList(el: El): VNode {
  const style = (el.style as string) ?? "ordered";
  const items =
    (el.items as Array<{ content: string; trailing?: string }>) ?? [];
  const rows = items.slice(0, 4).map((item, i) => {
    const prefix =
      style === "ordered" ? `${i + 1}.` : style === "unordered" ? "•" : "";
    const prefixNode =
      prefix !== ""
        ? h(
            "div",
            { display: "flex", color: "#9CA3AF", fontSize: 13, minWidth: 20 },
            prefix,
          )
        : null;
    return h(
      "div",
      {
        display: "flex",
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        paddingTop: 6,
        paddingBottom: 6,
      },
      prefixNode,
      h(
        "div",
        { display: "flex", flex: 1, fontSize: 14, color: "#374151" },
        item.content,
      ),
      item.trailing
        ? h(
            "div",
            { display: "flex", fontSize: 13, color: "#9CA3AF" },
            item.trailing,
          )
        : null,
    );
  });
  return h("div", { display: "flex", flexDirection: "column" }, ...rows);
}

function mapButtonGroup(el: El, _accent: string): VNode {
  const options = (el.options as string[]) ?? [];
  const layout = (el.style as string) ?? "row";
  const isRow = layout !== "stack";
  const sliced = options.slice(0, 4);
  const n = sliced.length;
  const gapPx = 8;

  // Match `renderSnapPage` `renderButtonGroup`: white pills, gray border, dark text.
  // Do not use flexGrow/flexBasis for row pills — Yoga in Satori overlaps labels.
  const children = sliced.map((opt) => {
    const pill: Record<string, unknown> = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 12,
      paddingRight: 12,
      borderRadius: 8,
      border: "1px solid #E5E7EB",
      backgroundColor: "#FFFFFF",
      color: "#374151",
      fontSize: 14,
      fontWeight: 400,
      overflow: "hidden",
      textAlign: "center",
      boxSizing: "border-box",
      flexShrink: 0,
    };

    if (isRow && n > 0) {
      const totalGaps = (n - 1) * gapPx;
      pill.width = Math.floor((OG_CARD_INNER_WIDTH_PX - totalGaps) / n);
    } else {
      pill.width = OG_CARD_INNER_WIDTH_PX;
      pill.alignSelf = "center";
    }

    return h("div", pill, opt);
  });

  return h(
    "div",
    {
      display: "flex",
      flexDirection: isRow ? "row" : "column",
      alignItems: isRow ? "flex-start" : "stretch",
      width: OG_CARD_INNER_WIDTH_PX,
      gap: gapPx,
    },
    ...children,
  );
}

function mapBarChart(el: El, accent: string): VNode {
  const bars =
    (el.bars as Array<{ label: string; value: number; color?: string }>) ?? [];
  const maxVal =
    (el.max as number | undefined) ?? Math.max(...bars.map((b) => b.value), 1);
  const chartDefault = colorHex(el.color as string | undefined, accent);
  const barNodes = bars.slice(0, 6).map((bar) => {
    const color =
      bar.color !== undefined && bar.color !== ""
        ? colorHex(bar.color as string, accent)
        : chartDefault;
    const pct = maxVal > 0 ? Math.min(100, (bar.value / maxVal) * 100) : 0;
    return h(
      "div",
      { display: "flex", flexDirection: "row", alignItems: "center", gap: 8, width: OG_CARD_INNER_WIDTH_PX },
      h("div", { display: "flex", width: 80, fontSize: 12, color: "#6B7280", justifyContent: "flex-end" }, bar.label.slice(0, 20)),
      h(
        "div",
        { display: "flex", flex: 1, height: 10, backgroundColor: "#E5E7EB", borderRadius: 9999, overflow: "hidden" },
        h("div", { display: "flex", height: 10, width: `${pct}%`, backgroundColor: color, borderRadius: 9999 }),
      ),
      h("div", { display: "flex", width: 32, fontSize: 12, color: "#6B7280" }, String(bar.value)),
    );
  });
  return h(
    "div",
    { display: "flex", flexDirection: "column", gap: 8, width: OG_CARD_INNER_WIDTH_PX },
    ...barNodes,
  );
}

function mapCellGrid(el: El, accent: string): VNode {
  const cols = Number(el.cols ?? 2);
  const rows = Number(el.rows ?? 2);
  const cells = Array.isArray(el.cells) ? (el.cells as Array<{ row?: number; col?: number; color?: string; content?: string }>) : [];
  const gap = String(el.gap ?? "sm");
  const gapMap: Record<string, number> = { none: 0, sm: 1, md: 2, lg: 4 };
  const gapPx = gapMap[gap] ?? 1;
  const cellW = Math.floor((OG_CARD_INNER_WIDTH_PX - (cols - 1) * gapPx) / cols);

  const cellMap = new Map<string, { color?: string; content?: string }>();
  for (const c of cells) {
    cellMap.set(`${Number(c.row ?? 0)},${Number(c.col ?? 0)}`, { color: c.color, content: c.content });
  }

  const rowNodes = [];
  for (let r = 0; r < rows; r++) {
    const cellNodes = [];
    for (let c = 0; c < cols; c++) {
      const cell = cellMap.get(`${r},${c}`);
      const bg = cell?.color ? colorHex(cell.color, accent) : "#F3F4F6";
      cellNodes.push(
        h("div", {
          display: "flex", alignItems: "center", justifyContent: "center",
          width: cellW, height: cellW > 28 ? 28 : cellW, borderRadius: 4,
          backgroundColor: bg, border: "1px solid #E5E7EB",
          fontSize: 10, fontWeight: 600, color: "#374151",
        }, cell?.content ?? ""),
      );
    }
    rowNodes.push(h("div", { display: "flex", flexDirection: "row", gap: gapPx }, ...cellNodes));
  }
  return h("div", { display: "flex", flexDirection: "column", gap: gapPx, width: OG_CARD_INNER_WIDTH_PX }, ...rowNodes);
}

function mapElement(
  el: El,
  accent: string,
  imageMap: Map<string, string>,
): VNode | null {
  const type = el.type as string;
  switch (type) {
    case "text":
      return mapText(el);
    case "item":
      return mapItem(el);
    case "badge":
      return mapBadge(el, accent);
    case "image":
      return mapImage(el, imageMap);
    case "separator":
    case "divider":
      return mapSeparator();
    case "progress":
      return mapProgress(el, accent);
    case "toggle_group":
      return mapButtonGroup(el, accent);
    case "input": {
      const label = el.label ? String(el.label) : "";
      const placeholder = el.placeholder ? String(el.placeholder) : "";
      return h(
        "div",
        { display: "flex", flexDirection: "column", gap: 6, width: OG_CARD_INNER_WIDTH_PX },
        label ? h("div", { display: "flex", fontSize: 13, fontWeight: 500, color: "#374151" }, label) : null,
        h("div", {
          display: "flex", padding: "10px 12px", borderRadius: 8,
          border: "1px solid #E5E7EB", backgroundColor: "#fff",
          fontSize: 14, color: "#9CA3AF",
        }, placeholder || " "),
      );
    }
    case "switch": {
      const label = el.label ? String(el.label) : "";
      const checked = Boolean(el.defaultChecked);
      const bg = checked ? accent : "#D1D5DB";
      return h(
        "div",
        { display: "flex", alignItems: "center", justifyContent: "space-between", width: OG_CARD_INNER_WIDTH_PX },
        h("div", { display: "flex", fontSize: 14, color: "#374151" }, label),
        h("div", { display: "flex", width: 44, height: 24, borderRadius: 12, backgroundColor: bg, position: "relative" },
          h("div", { display: "flex", width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", position: "absolute", top: 2, left: checked ? 20 : 2 }),
        ),
      );
    }
    case "slider": {
      const label = el.label ? String(el.label) : "";
      return h(
        "div",
        { display: "flex", flexDirection: "column", gap: 6, width: OG_CARD_INNER_WIDTH_PX },
        label ? h("div", { display: "flex", fontSize: 13, fontWeight: 500, color: "#374151" }, label) : null,
        h("div", { display: "flex", height: 10, backgroundColor: "#E5E7EB", borderRadius: 9999, width: "100%" },
          h("div", { display: "flex", height: 10, width: "50%", backgroundColor: accent, borderRadius: 9999 }),
        ),
      );
    }
    // Legacy types kept for backward compat with older specs
    case "list":
      return mapList(el);
    case "bar_chart":
      return mapBarChart(el, accent);
    case "cell_grid":
      return mapCellGrid(el, accent);
    case "group": {
      const children = (el.children as El[]) ?? [];
      const childNodes = children
        .map((c) => mapElement(c, accent, imageMap))
        .filter((n): n is VNode => n != null);
      return h(
        "div",
        { display: "flex", flexDirection: "row", gap: 12 },
        ...childNodes.map((c) => h("div", { display: "flex", flex: 1 }, c)),
      );
    }
    default:
      return null;
  }
}

function mapButton(btn: El, accent: string, i: number): VNode {
  const label = String(btn.label ?? "");
  const variant = (btn.variant as string) ?? (btn.style as string) ?? "secondary";
  const isPrimary = variant === "primary";
  // Primary CTA: generous vertical padding + minHeight so Satori/Yoga renders a tall tap target
  // (small padding deltas are easy to miss; flexBasis:0 rows can also under-measure height).
  const py = isPrimary ? 18 : 10;
  const btnStyle: Record<string, unknown> = {
    display: "flex",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: py,
    paddingBottom: py,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 10,
    backgroundColor: isPrimary ? accent : "transparent",
    color: isPrimary ? "#fff" : accent,
    border: isPrimary ? "none" : `2px solid ${accent}`,
    fontSize: 14,
    fontWeight: 600,
    boxSizing: "border-box",
  };
  if (isPrimary) {
    btnStyle.minHeight = 52;
  }
  return h("div", btnStyle, label);
}

function linesForWrappedText(
  charCount: number,
  innerWidthPx: number,
  avgCharPx: number,
): number {
  if (charCount <= 0) return 1;
  const cpl = Math.max(8, Math.floor(innerWidthPx / avgCharPx));
  return Math.max(1, Math.ceil((charCount * 1.12) / cpl));
}

function estimateTextHeight(el: El): number {
  const size = String(el.size ?? "md");
  const content = String(el.content ?? "");
  const w = OG_CARD_INNER_WIDTH_PX;
  if (size === "sm") return linesForWrappedText(content.length, w, 7) * 20;
  return linesForWrappedText(content.length, w, 7.5) * 23;
}

function estimateItemHeight(el: El): number {
  const title = String(el.title ?? "");
  const desc = el.description ? String(el.description) : "";
  const w = OG_CARD_INNER_WIDTH_PX;
  let total = linesForWrappedText(title.length, w, 7.5) * 23 + 12;
  if (desc) total += linesForWrappedText(desc.length, w, 7) * 20;
  return total;
}

function estimateImageHeight(el: El, imageMap: Map<string, string>): number {
  const url = el.url as string;
  if (!imageMap.has(url)) return 80;
  const aspect = (el.aspect as string) ?? "16:9";
  const parts = aspect.split(":").map(Number);
  const aw = parts[0];
  const ah = parts[1];
  if (!aw || !ah || aw <= 0 || ah <= 0) {
    return Math.round((OG_CARD_INNER_WIDTH_PX * 9) / 16);
  }
  return Math.round((OG_CARD_INNER_WIDTH_PX * ah) / aw);
}

function estimateProgressHeight(el: El): number {
  const label = el.label ? String(el.label) : "";
  let h = 0;
  if (label) {
    const lines = linesForWrappedText(label.length, OG_CARD_INNER_WIDTH_PX, 7);
    h += lines * 18 + 4;
  }
  h += 8;
  return h;
}

function estimateListHeight(el: El): number {
  const items =
    (el.items as Array<{ content: string; trailing?: string }>) ?? [];
  const textWidth = OG_CARD_INNER_WIDTH_PX - 28;
  let total = 0;
  for (const item of items.slice(0, 4)) {
    const text = item.content ?? "";
    const lines = linesForWrappedText(text.length, textWidth, 7.5);
    total += 12 + Math.max(20, lines * 21);
  }
  return total;
}

function estimateButtonGroupHeight(el: El): number {
  const options = (el.options as string[]) ?? [];
  const layout = (el.style as string) ?? "row";
  const isRow = layout !== "stack";
  const sliced = options.slice(0, 4);
  const n = sliced.length;
  if (n === 0) return 0;
  const pillW =
    isRow && n > 0
      ? Math.floor((OG_CARD_INNER_WIDTH_PX - (n - 1) * 8) / n)
      : OG_CARD_INNER_WIDTH_PX;
  const pillHeights = sliced.map((opt) => {
    const lines = linesForWrappedText(
      opt.length,
      Math.max(40, pillW - 24),
      7.5,
    );
    return Math.max(42, 10 + 10 + lines * 16 + 2);
  });
  if (isRow) return Math.max(...pillHeights);
  return pillHeights.reduce((a, b) => a + b, 0) + (n - 1) * 8;
}

function estimateElementHeight(el: El, imageMap: Map<string, string>): number {
  const type = el.type as string;
  switch (type) {
    case "text":
      return estimateTextHeight(el);
    case "item":
      return estimateItemHeight(el);
    case "badge":
      return 24;
    case "image":
      return estimateImageHeight(el, imageMap);
    case "separator":
    case "divider":
      return 1;
    case "progress":
      return estimateProgressHeight(el);
    case "input":
      return (el.label ? 20 : 0) + 42;
    case "switch":
      return 28;
    case "slider":
      return (el.label ? 20 : 0) + 16;
    case "list":
      return estimateListHeight(el);
    case "toggle_group":
      return estimateButtonGroupHeight(el);
    case "bar_chart": {
      const bars = Array.isArray(el.bars) ? el.bars : [];
      return Math.max(1, bars.length) * 26;
    }
    case "cell_grid": {
      const rows = Number(el.rows ?? 2);
      const gap = String(el.gap ?? "sm");
      const gapMap: Record<string, number> = { none: 0, sm: 1, md: 2, lg: 4 };
  const gapPx = gapMap[gap] ?? 1;
      return rows * 28 + (rows - 1) * gapPx;
    }
    case "group": {
      const children = (el.children as El[]) ?? [];
      if (children.length === 0) return 0;
      return Math.max(
        ...children.map((c) => estimateElementHeight(c, imageMap)),
      );
    }
    default:
      return 0;
  }
}

function estimateButtonsBlockHeight(
  buttons: El[],
  buttonLayout: string | undefined,
): number {
  if (buttons.length === 0) return 0;
  const isRow = buttonLayout === "row";
  const heights = buttons.map((btn, i) => {
    const style = (btn.style as string) ?? (i === 0 ? "primary" : "secondary");
    const isPrimary = style === "primary";
    const label = String(btn.label ?? "");
    const inner = isRow
      ? Math.floor(
          (OG_CARD_INNER_WIDTH_PX - (buttons.length - 1) * 8) / buttons.length,
        )
      : OG_CARD_INNER_WIDTH_PX;
    const lines = linesForWrappedText(
      label.length,
      Math.max(40, inner - 24),
      7,
    );
    if (isPrimary) {
      return Math.max(52, 18 + 18 + lines * 17);
    }
    return Math.max(44, 10 + 10 + lines * 15 + 4);
  });
  if (isRow) {
    return Math.max(...heights);
  }
  return heights.reduce((a, b) => a + b, 0) + (buttons.length - 1) * 8;
}

function estimateDefaultOgHeight(
  elements: El[],
  imageMap: Map<string, string>,
  buttons: El[],
  buttonLayout: string | undefined,
): number {
  let innerColumn = 0;
  for (const el of elements) {
    innerColumn += estimateElementHeight(el, imageMap) + OG_ELEMENT_GAP_PX;
  }
  if (buttons.length > 0) {
    innerColumn +=
      OG_BUTTONS_TOP_GAP_PX + estimateButtonsBlockHeight(buttons, buttonLayout);
  }
  const cardH = OG_CARD_PADDING_PX * 2 + innerColumn;
  const outerH = 2 * OG_OUTER_MARGIN_PX + cardH + OG_HEIGHT_SAFETY_PX;
  return Math.min(
    OG_MAX_HEIGHT_PX,
    Math.max(OG_MIN_HEIGHT_PX, Math.ceil(outerH)),
  );
}

// ─── Spec helpers ─────────────────────────────────────

/** Walk the flat spec from root, recursing into stack containers, and collect leaf elements as El objects. */
function specToElementList(spec: SnapSpec): El[] {
  function collect(keys: string[]): El[] {
    const result: El[] = [];
    for (const key of keys) {
      const el = spec.elements[key];
      if (!el) continue;
      // Recurse into stack and item_group containers
      if ((el.type === "stack" || el.type === "item_group") && el.children?.length) {
        result.push(...collect(el.children));
      } else {
        result.push({ type: el.type, ...el.props } as El);
      }
    }
    return result;
  }
  const rootEl = spec.elements[spec.root];
  if (!rootEl?.children) return [];
  return collect(rootEl.children);
}

/** Extract button elements (type: "button") from the spec. */
function specToButtons(spec: SnapSpec): El[] {
  return Object.values(spec.elements)
    .filter((el) => el.type === "button")
    .map((el) => ({ type: "button", ...el.props }) as El);
}

// ─── Main PNG renderer ─────────────────────────────────────

export async function renderSnapPageToPng(
  snap: SnapHandlerResult,
  options?: OgOptions,
): Promise<Uint8Array> {
  const accent = accentHex(snap.theme?.accent as string | undefined);
  const spec = snap.ui as unknown as SnapSpec;
  const elements = specToElementList(spec);
  const pageButtons = specToButtons(spec);

  // Pre-fetch all image URLs (SSRF-safe)
  const imageUrls = elements
    .filter((el) => el.type === "image")
    .map((el) => el.url as string);
  const unique = [...new Set(imageUrls)];
  const fetched = await Promise.all(
    unique.map(async (url) => [url, await safeFetchImage(url)] as const),
  );
  const imageMap = new Map(
    fetched.filter(([, v]) => v != null) as [string, string][],
  );

  const W = options?.width ?? DEFAULT_OG_WIDTH_PX;
  const H =
    options?.height ??
    estimateDefaultOgHeight(
      elements,
      imageMap,
      pageButtons,
      "column",
    );

  // Build element VNodes (skip buttons — handled separately)
  const elementNodes = elements
    .filter((el) => el.type !== "button")
    .map((el) => mapElement(el, accent, imageMap))
    .filter((n): n is VNode => n != null);

  // Build button VNodes
  const buttonNodes = pageButtons.map((btn, i) => mapButton(btn, accent, i));

  const cardChildren: VNode[] = [
    ...elementNodes.map((n) =>
      h(
        "div",
        {
          display: "flex",
          marginBottom: 12,
          width: OG_CARD_INNER_WIDTH_PX,
        },
        n,
      ),
    ),
    ...(buttonNodes.length > 0
      ? [
          h(
            "div",
            {
              display: "flex",
              flexDirection: "column" as const,
              gap: 8,
              marginTop: 12,
              width: OG_CARD_INNER_WIDTH_PX,
            },
            ...buttonNodes,
          ),
        ]
      : []),
  ];

  const root = h(
    "div",
    {
      display: "flex",
      width: W,
      height: H,
      backgroundColor: "#F3F4F6",
      alignItems: "center",
      justifyContent: "center",
    },
    h(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        width: OG_CARD_OUTER_WIDTH_PX,
        boxSizing: "border-box",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      },
      ...cardChildren,
    ),
  );

  // Load fonts (disk paths → CDN fallback)
  const fonts = await buildFontList(options?.fonts);

  // Render SVG via satori (VNode is compatible with satori's element shape)
  const svg = await satori(root as Parameters<typeof satori>[0], {
    width: W,
    height: H,
    fonts,
  });

  // Convert SVG → PNG via resvg-wasm
  await ensureResvg();
  const renderer = new Resvg(svg, { background: "#F3F4F6" });
  return renderer.render().asPng();
}
