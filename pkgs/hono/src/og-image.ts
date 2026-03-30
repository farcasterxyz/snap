import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import satori from "satori";
import {
  DEFAULT_THEME_ACCENT,
  ELEMENT_TYPE,
  PALETTE_LIGHT_HEX,
  TEXT_STYLE,
  type Element,
  type SnapPage,
} from "@farcaster/snap";

const FONT_INTER_400 =
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-400-normal.ttf";
const FONT_INTER_700 =
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-700-normal.ttf";
const RESVG_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

export type OgRenderOptions = {
  width?: number;
  height?: number;
};

type VNode = {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: VNode | VNode[] | string | number | null | undefined;
    src?: string;
    alt?: string;
  };
};

function h(
  type: string,
  style: Record<string, string | number> | undefined,
  children?: VNode | VNode[] | string | number | null,
  extras?: Pick<VNode["props"], "src" | "alt">,
): VNode {
  const props: VNode["props"] = {
    style,
    children: children as VNode["props"]["children"],
    ...extras,
  };
  return { type, props };
}

function accentHex(page: SnapPage): string {
  const a = page.theme?.accent ?? DEFAULT_THEME_ACCENT;
  return PALETTE_LIGHT_HEX[a];
}

function progressColor(
  color: string | undefined,
  accent: string,
): string {
  if (!color || color === "accent") return accent;
  return PALETTE_LIGHT_HEX[color as keyof typeof PALETTE_LIGHT_HEX] ?? accent;
}

function mapElement(element: Element, accent: string): VNode | VNode[] | null {
  switch (element.type) {
    case ELEMENT_TYPE.text: {
      const base: Record<string, string | number> = {
        display: "flex",
        width: "100%",
      };
      if (element.style === TEXT_STYLE.title) {
        Object.assign(base, {
          fontSize: 22,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1.2,
        });
      } else if (element.style === TEXT_STYLE.body) {
        Object.assign(base, {
          fontSize: 15,
          fontWeight: 400,
          color: "#374151",
          lineHeight: 1.35,
        });
      } else if (element.style === TEXT_STYLE.caption) {
        Object.assign(base, {
          fontSize: 13,
          fontWeight: 400,
          color: "#6b7280",
          lineHeight: 1.3,
        });
      } else {
        Object.assign(base, {
          fontSize: 14,
          fontWeight: 500,
          color: "#374151",
        });
      }
      if (element.align === "center") base.textAlign = "center";
      if (element.align === "right") base.textAlign = "right";
      return h("div", base, element.content);
    }
    case ELEMENT_TYPE.image:
      return h(
        "img",
        {
          display: "flex",
          width: "100%",
          maxHeight: 180,
          objectFit: "contain",
          borderRadius: 10,
        },
        undefined,
        { src: element.url, alt: element.alt ?? "" },
      );
    case ELEMENT_TYPE.video:
      return h(
        "div",
        {
          display: "flex",
          width: "100%",
          height: 80,
          backgroundColor: "#f3f4f6",
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: "#6b7280",
        },
        "Video",
      );
    case ELEMENT_TYPE.divider:
      return h("div", {
        width: "100%",
        height: 1,
        backgroundColor: "#e5e7eb",
      });
    case ELEMENT_TYPE.spacer: {
      const gap = element.size === "small" ? 6 : element.size === "large" ? 20 : 12;
      return h("div", { width: "100%", height: gap });
    }
    case ELEMENT_TYPE.progress: {
      const pct = Math.min(100, Math.max(0, (element.value / element.max) * 100));
      const bar = progressColor(element.color, accent);
      return h("div", { display: "flex", flexDirection: "column", gap: 6, width: "100%" }, [
        element.label
          ? h("div", { fontSize: 13, color: "#374151" }, element.label)
          : null,
        h("div", {
          width: "100%",
          height: 8,
          backgroundColor: "#e5e7eb",
          borderRadius: 4,
          position: "relative",
        }, [
          h("div", {
            width: `${pct}%`,
            height: 8,
            backgroundColor: bar,
            borderRadius: 4,
          }),
        ]),
      ].filter(Boolean) as VNode[]);
    }
    case ELEMENT_TYPE.list: {
      const items = element.items.map((item, i) => {
        const prefix =
          element.style === "ordered"
            ? `${i + 1}. `
            : element.style === "unordered"
              ? "• "
              : "";
        const line = item.trailing
          ? `${prefix}${item.content}  ${item.trailing}`
          : `${prefix}${item.content}`;
        return h("div", { fontSize: 14, color: "#374151", marginBottom: 4 }, line);
      });
      return h("div", { display: "flex", flexDirection: "column", width: "100%" }, items);
    }
    case ELEMENT_TYPE.grid: {
      const cells = element.cells.slice(0, 12).map((c) =>
        h(
          "div",
          {
            display: "flex",
            flex: 1,
            minWidth: 24,
            minHeight: 24,
            backgroundColor: c.color ?? "#f3f4f6",
            borderRadius: 4,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "#374151",
          },
          c.content ?? "",
        ),
      );
      return h(
        "div",
        {
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          width: "100%",
        },
        cells,
      );
    }
    case ELEMENT_TYPE.text_input:
      return h(
        "div",
        {
          display: "flex",
          width: "100%",
          height: 40,
          backgroundColor: "#f9fafb",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          alignItems: "center",
          paddingLeft: 12,
          fontSize: 14,
          color: "#9ca3af",
        },
        element.placeholder ?? "Input",
      );
    case ELEMENT_TYPE.slider:
      return h("div", { display: "flex", flexDirection: "column", gap: 4, width: "100%" }, [
        element.label
          ? h("div", { fontSize: 13, color: "#374151" }, element.label)
          : null,
        h("div", { fontSize: 12, color: "#6b7280" }, String(element.value)),
      ].filter(Boolean) as VNode[]);
    case ELEMENT_TYPE.button_group: {
      const opts = element.options.map((o) =>
        h(
          "div",
          {
            display: "flex",
            padding: "6px 12px",
            borderRadius: 8,
            border: `1px solid ${accent}`,
            fontSize: 13,
            color: accent,
            backgroundColor: "#ffffff",
          },
          o,
        ),
      );
      const stackOpts = element.style === "stack";
      return h(
        "div",
        {
          display: "flex",
          flexDirection: stackOpts ? "column" : "row",
          flexWrap: "wrap",
          gap: 8,
          width: "100%",
        },
        opts,
      );
    }
    case ELEMENT_TYPE.toggle:
      return h("div", { display: "flex", alignItems: "center", gap: 8, width: "100%" }, [
        h("div", {
          width: 36,
          height: 20,
          borderRadius: 10,
          backgroundColor: element.value ? accent : "#e5e7eb",
        }),
        h("div", { fontSize: 14, color: "#374151" }, element.label),
      ]);
    case ELEMENT_TYPE.group: {
      const kids = element.children
        .map((c) => mapElement(c, accent))
        .flat()
        .filter(Boolean) as VNode[];
      return h(
        "div",
        { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%" },
        kids,
      );
    }
    case ELEMENT_TYPE.bar_chart: {
      const maxVal =
        element.max ?? Math.max(...element.bars.map((b) => b.value), 1);
      const bars = element.bars.map((b) => {
        const w = maxVal > 0 ? (b.value / maxVal) * 100 : 0;
        const col =
          b.color != null
            ? PALETTE_LIGHT_HEX[b.color]
            : element.color && element.color !== "accent"
              ? PALETTE_LIGHT_HEX[element.color as keyof typeof PALETTE_LIGHT_HEX]
              : accent;
        return h("div", { display: "flex", flexDirection: "column", gap: 4, width: "100%" }, [
          h("div", { fontSize: 11, color: "#6b7280" }, b.label),
          h("div", {
            width: "100%",
            height: 10,
            backgroundColor: "#e5e7eb",
            borderRadius: 4,
          }, [
            h("div", {
              width: `${w}%`,
              height: 10,
              backgroundColor: col,
              borderRadius: 4,
            }),
          ]),
        ]);
      });
      return h("div", { display: "flex", flexDirection: "column", gap: 8, width: "100%" }, bars);
    }
    default:
      return null;
  }
}

function buildTree(page: SnapPage, width: number, height: number): VNode {
  const accent = accentHex(page);
  const body: VNode[] = [];
  for (const child of page.elements.children) {
    const n = mapElement(child, accent);
    if (n == null) continue;
    if (Array.isArray(n)) body.push(...n);
    else body.push(n);
  }
  if (page.buttons?.length) {
    const btns = page.buttons.map((b, i) => {
      const primary =
        b.style !== "secondary" && (i === 0 || page.buttons!.length === 1);
      return h(
        "div",
        {
          display: "flex",
          width: "100%",
          height: 44,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 600,
          backgroundColor: primary ? accent : "#ffffff",
          color: primary ? "#ffffff" : accent,
          border: primary ? "none" : `2px solid ${accent}`,
        },
        b.label,
      );
    });
    body.push(
      h("div", { display: "flex", flexDirection: "column", gap: 8, width: "100%", marginTop: 4 }, btns),
    );
  }
  const card = h("div", {
    display: "flex",
    flexDirection: "column",
    width: 420,
    maxWidth: "90%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: 16,
    gap: 12,
    boxSizing: "border-box",
  }, body);
  return h("div", {
    display: "flex",
    width,
    height,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  }, card);
}

let resvgReady: Promise<void> | undefined;
async function ensureResvg(): Promise<void> {
  if (resvgReady) return resvgReady;
  resvgReady = (async () => {
    const { initWasm } = await import("@resvg/resvg-wasm");
    let input: BufferSource;
    if (typeof process !== "undefined" && process.versions?.node) {
      const require = createRequire(fileURLToPath(import.meta.url));
      const wasmPath = require.resolve("@resvg/resvg-wasm/index_bg.wasm");
      input = readFileSync(wasmPath);
    } else {
      const r = await fetch(RESVG_WASM_CDN);
      if (!r.ok) throw new Error(`resvg wasm fetch failed: ${r.status}`);
      input = await r.arrayBuffer();
    }
    await initWasm(input);
  })();
  return resvgReady;
}

type FontEntry = {
  name: string;
  data: ArrayBuffer;
  weight: number;
  style: "normal";
};

let fontsPromise: Promise<FontEntry[]> | undefined;

async function loadFonts(): Promise<FontEntry[]> {
  if (fontsPromise) return fontsPromise;
  fontsPromise = (async () => {
    const out: FontEntry[] = [];
    for (const [url, weight] of [
      [FONT_INTER_400, 400],
      [FONT_INTER_700, 700],
    ] as const) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        out.push({
          name: "Inter",
          data: await r.arrayBuffer(),
          weight,
          style: "normal",
        });
      } catch {
        /* ignore */
      }
    }
    return out;
  })();
  return fontsPromise;
}

const pngCache = new Map<string, { png: Uint8Array; etag: string }>();
const CACHE_MAX = 20;

function cachePrune(): void {
  while (pngCache.size > CACHE_MAX) {
    const first = pngCache.keys().next().value;
    if (first === undefined) break;
    pngCache.delete(first);
  }
}

function etagForPage(page: SnapPage): string {
  return createHash("sha256").update(JSON.stringify(page)).digest("hex").slice(0, 32);
}

export async function renderSnapPageToPng(
  page: SnapPage,
  options: OgRenderOptions = {},
): Promise<{ png: Uint8Array; etag: string }> {
  const width = options.width ?? 1200;
  const height = options.height ?? 630;
  const etag = etagForPage(page);
  const cacheKey = etag;
  const hit = pngCache.get(cacheKey);
  if (hit && hit.etag === etag) return hit;

  await ensureResvg();
  const fonts = await loadFonts();
  const tree = buildTree(page, width, height);
  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width,
    height,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
      style: f.style,
    })),
  });

  const { Resvg } = await import("@resvg/resvg-wasm");
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: width,
    },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();

  const entry = { png, etag };
  pngCache.set(cacheKey, entry);
  cachePrune();
  return entry;
}
