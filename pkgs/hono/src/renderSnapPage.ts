import type {
  SnapHandlerResult,
  SnapSpec,
  SnapUIElement,
  PaletteColor,
} from "@farcaster/snap";
import {
  DEFAULT_THEME_ACCENT,
  PALETTE_LIGHT_HEX,
  PALETTE_COLOR_ACCENT,
} from "@farcaster/snap";

// ─── OG meta ────────────────────────────────────────────

export type RenderSnapPageOptions = {
  ogImageUrl?: string;
  resourcePath?: string;
  siteName?: string;
  openGraph?: { title?: string; description?: string };
};

type PageMeta = {
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
};

export function extractPageMeta(spec: SnapSpec): PageMeta {
  let title = "Farcaster Snap";
  let description = "";
  let imageUrl: string | undefined;
  let imageAlt: string | undefined;

  // Fallbacks from text elements (lower priority than item)
  let textTitle: string | undefined;
  let textDescription: string | undefined;

  for (const el of Object.values(spec.elements)) {
    const e = el as SnapUIElement;
    if (e.type === "item") {
      if (title === "Farcaster Snap" && e.props?.title) {
        title = String(e.props.title);
      }
      if (!description && e.props?.description) {
        description = String(e.props.description);
      }
    }
    if (e.type === "text" && e.props?.content) {
      const content = String(e.props.content);
      if (!textTitle && String(e.props.weight ?? "") === "bold") {
        textTitle = content;
      } else if (!textDescription && String(e.props.weight ?? "") !== "bold") {
        textDescription = content;
      }
    }
    if (e.type === "image" && !imageUrl) {
      imageUrl = e.props?.url ? String(e.props.url) : undefined;
      imageAlt = e.props?.alt ? String(e.props.alt) : undefined;
    }
  }

  // Use text fallbacks if no item-derived values
  if (title === "Farcaster Snap" && textTitle) title = textTitle;
  if (!description && textDescription) description = textDescription;

  return {
    title,
    description: description || title,
    imageUrl,
    imageAlt,
  };
}

function buildOgMeta(opts: {
  title: string;
  description: string;
  pageUrl: string;
  ogImageUrl?: string;
  imageAlt?: string;
  siteName?: string;
}): string {
  const { title, description, pageUrl, ogImageUrl, imageAlt, siteName } = opts;
  const imgUrl = ogImageUrl ?? undefined;
  const twitterCard = imgUrl ? "summary_large_image" : "summary";

  const lines = [
    `<meta name="description" content="${esc(description)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(pageUrl)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="en_US">`,
  ];

  if (siteName) {
    lines.push(`<meta property="og:site_name" content="${esc(siteName)}">`);
  }
  if (imgUrl) {
    lines.push(`<meta property="og:image" content="${esc(imgUrl)}">`);
    lines.push(
      `<meta property="og:image:alt" content="${esc(imageAlt ?? title)}">`,
    );
  }
  lines.push(
    `<meta name="twitter:card" content="${twitterCard}">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
  );
  if (imgUrl) {
    lines.push(`<meta name="twitter:image" content="${esc(imgUrl)}">`);
  }
  return lines.join("\n");
}

const FC_ICON = `<svg viewBox="0 0 520 457" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M519.801 0V61.6809H458.172V123.31H477.054V123.331H519.801V456.795H416.57L416.507 456.49L363.832 207.03C358.81 183.251 345.667 161.736 326.827 146.434C307.988 131.133 284.255 122.71 260.006 122.71H259.8C235.551 122.71 211.818 131.133 192.979 146.434C174.139 161.736 160.996 183.259 155.974 207.03L103.239 456.795H0V123.323H42.7471V123.31H61.6262V61.6809H0V0H519.801Z" fill="currentColor"/></svg>`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function accentHex(accent: PaletteColor | undefined): string {
  return accent && PALETTE_LIGHT_HEX[accent]
    ? PALETTE_LIGHT_HEX[accent]
    : PALETTE_LIGHT_HEX[DEFAULT_THEME_ACCENT];
}

function colorHex(color: string | undefined, accent: string): string {
  if (!color || color === PALETTE_COLOR_ACCENT) return accent;
  return (PALETTE_LIGHT_HEX as Record<string, string>)[color] ?? accent;
}

/** Readable foreground for a hex background (YIQ contrast check). */
function fgForBg(hex: string): string {
  const h = hex.replace(/^#/, "");
  if (h.length !== 6) return "#ffffff";
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 180 ? "#0a0a0a" : "#ffffff";
}

/** Lucide-style SVG paths for all snap icons. */
const ICON_SVGS: Record<string, string> = {
  check: `<polyline points="20 6 9 17 4 12"/>`,
  x: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
  heart: `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`,
  star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  info: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`,
  "arrow-right": `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,
  "arrow-left": `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`,
  "chevron-right": `<polyline points="9 18 15 12 9 6"/>`,
  "external-link": `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>`,
  "alert-triangle": `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
  clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  "message-circle": `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>`,
  repeat: `<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>`,
  share: `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>`,
  user: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  users: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  trophy: `<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>`,
  zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  flame: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`,
  gift: `<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>`,
  image: `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>`,
  play: `<polygon points="5 3 19 12 5 21 5 3"/>`,
  pause: `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`,
  wallet: `<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>`,
  coins: `<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>`,
  plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  minus: `<line x1="5" y1="12" x2="19" y2="12"/>`,
  "refresh-cw": `<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>`,
  bookmark: `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>`,
  "thumbs-up": `<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>`,
  "thumbs-down": `<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>`,
  "trending-up": `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
  "trending-down": `<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>`,
};

// ─── Element renderers ──────────────────────────────────

function renderIcon(name: string, size: number, color: string): string {
  const inner = ICON_SVGS[name] ?? `<circle cx="12" cy="12" r="4"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex-shrink:0">${inner}</svg>`;
}

function renderElement(key: string, spec: SnapSpec, accent: string): string {
  const el = spec.elements[key] as SnapUIElement | undefined;
  if (!el) return "";
  const p = el.props ?? {};

  switch (el.type) {
    case "icon": {
      const color = colorHex(p.color as string | undefined, accent);
      const size = String(p.size ?? "md") === "sm" ? 16 : 20;
      const name = String(p.name ?? "info");
      return `<span style="display:inline-flex;align-items:center">${renderIcon(
        name,
        size,
        color,
      )}</span>`;
    }
    case "badge": {
      const color = colorHex(p.color as string | undefined, accent);
      const badgeVariant = String(p.variant ?? "default");
      const isFilled = badgeVariant === "default";
      const fg = isFilled ? fgForBg(color) : color;
      const bgStyle = isFilled
        ? `background:${color};color:${fg}`
        : `border:1px solid ${color};color:${color}`;
      const iconName = p.icon ? String(p.icon) : undefined;
      const iconHtml = iconName ? renderIcon(iconName, 12, fg) : "";
      const gap = iconHtml ? "gap:4px;" : "";
      return `<span style="display:inline-flex;align-items:center;${gap}padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;line-height:1.5;${bgStyle}">${iconHtml}${esc(
        String(p.label ?? ""),
      )}</span>`;
    }
    case "image": {
      const url = esc(String(p.url ?? ""));
      const aspect = String(p.aspect ?? "1:1");
      const [w, h] = aspect.split(":").map(Number);
      const ratio = w && h ? `${w}/${h}` : "1/1";
      return `<div style="flex:1;aspect-ratio:${ratio};border-radius:8px;overflow:hidden;background:#F3F4F6"><img src="${url}" alt="${esc(
        String(p.alt ?? ""),
      )}" style="width:100%;height:100%;object-fit:cover"></div>`;
    }
    case "item": {
      const descHtml = p.description
        ? `<div style="font-size:13px;color:#6B7280;margin-top:2px">${esc(
            String(p.description),
          )}</div>`
        : "";
      const childIds = el.children ?? [];
      const actionsHtml =
        childIds.length > 0
          ? `<div style="margin-left:auto;padding-left:12px;display:flex;align-items:center;gap:4px">${childIds
              .map((id) => renderElement(id, spec, accent))
              .join("")}</div>`
          : "";
      return `<div style="display:flex;align-items:flex-start;padding:6px 10px"><div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:500;color:#111">${esc(
        String(p.title ?? ""),
      )}</div>${descHtml}</div>${actionsHtml}</div>`;
    }
    case "item_group": {
      const childIds = el.children ?? [];
      const border = Boolean(p.border);
      const separator = Boolean(p.separator);
      const outerStyle = border
        ? "border:1px solid #E5E7EB;border-radius:8px;overflow:hidden"
        : "";
      let html = `<div style="display:flex;flex-direction:column;${outerStyle}">`;
      for (let i = 0; i < childIds.length; i++) {
        if (separator && i > 0) {
          html += `<hr style="border:none;border-top:1px solid #E5E7EB;margin:0 12px">`;
        }
        const pad = border
          ? "padding:8px 12px;"
          : separator
          ? "padding:8px 0;"
          : "";
        html += `<div style="${pad}">${renderElement(
          childIds[i]!,
          spec,
          accent,
        )}</div>`;
      }
      html += `</div>`;
      return html;
    }
    case "progress": {
      const value = Number(p.value ?? 0);
      const max = Number(p.max ?? 100);
      const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
      const labelHtml = p.label
        ? `<div style="font-size:12px;color:#6B7280;margin-bottom:4px">${esc(
            String(p.label),
          )}</div>`
        : "";
      return `<div style="display:flex;flex:1;flex-direction:column;gap:4px">${labelHtml}<div style="height:10px;background:#E5E7EB;border-radius:9999px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${accent};border-radius:9999px;transition:width 0.3s"></div></div></div>`;
    }
    case "separator": {
      const orientation = String(p.orientation ?? "horizontal");
      if (orientation === "vertical")
        return `<div style="width:1px;background:#E5E7EB;align-self:stretch;min-height:16px"></div>`;
      return `<hr style="border:none;border-top:1px solid #E5E7EB;margin:4px 0">`;
    }
    case "slider": {
      const min = Number(p.min ?? 0);
      const max = Number(p.max ?? 100);
      const value =
        p.defaultValue !== undefined ? Number(p.defaultValue) : (min + max) / 2;
      const labelHtml = p.label
        ? `<div style="font-size:13px;font-weight:500;color:#374151;margin-bottom:6px">${esc(
            String(p.label),
          )}</div>`
        : "";
      return `<div style="display:flex;flex-direction:column;gap:6px">${labelHtml}<input type="range" min="${min}" max="${max}" value="${value}" disabled style="width:100%;height:10px;border-radius:9999px;accent-color:${accent};background:#E5E7EB;-webkit-appearance:none;appearance:none"></div>`;
    }
    case "switch": {
      const checked = Boolean(p.defaultChecked);
      const bg = checked ? accent : "#D1D5DB";
      const tx = checked ? "20px" : "2px";
      return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><span style="font-size:14px;color:#374151">${esc(
        String(p.label ?? ""),
      )}</span><div style="width:44px;height:24px;background:${bg};border-radius:12px;position:relative;transition:background 0.2s"><div style="width:20px;height:20px;background:#fff;border-radius:50%;position:absolute;top:2px;left:${tx};transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></div></div></div>`;
    }
    case "input": {
      const labelHtml = p.label
        ? `<label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:6px">${esc(
            String(p.label),
          )}</label>`
        : "";
      return `<div style="display:flex;flex-direction:column;gap:6px">${labelHtml}<input type="text" placeholder="${esc(
        String(p.placeholder ?? ""),
      )}" readonly style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid #E5E7EB;background:#fff;font-size:14px;color:#374151;font-family:inherit;box-sizing:border-box"></div>`;
    }
    case "toggle_group": {
      const options = Array.isArray(p.options) ? (p.options as string[]) : [];
      const orientation = String(p.orientation ?? "horizontal");
      const dir = orientation === "vertical" ? "column" : "row";
      const defaultVal =
        p.defaultValue !== undefined ? String(p.defaultValue) : undefined;
      const labelHtml = p.label
        ? `<div style="font-size:13px;font-weight:500;color:#374151;margin-bottom:6px">${esc(
            String(p.label),
          )}</div>`
        : "";
      let html = `<div>${labelHtml}<div style="display:flex;flex-direction:${dir};gap:4px;padding:4px;background:rgba(229,231,235,0.2);border-radius:8px">`;
      for (const opt of options) {
        const selected = defaultVal === opt;
        const optBg = selected ? accent : "transparent";
        const optColor = selected ? fgForBg(accent) : "#374151";
        const optWeight = selected ? "600" : "500";
        html += `<button onclick="showModal()" style="flex:1;padding:8px 12px;border-radius:6px;border:none;background:${optBg};font-size:13px;font-weight:${optWeight};color:${optColor};cursor:pointer;font-family:inherit;transition:background 0.15s,color 0.15s">${esc(
          opt,
        )}</button>`;
      }
      html += `</div></div>`;
      return html;
    }
    case "button": {
      const variant = String(p.variant ?? "secondary");
      const isPrimary = variant === "primary";
      const fg = isPrimary ? fgForBg(accent) : accent;
      const bg = isPrimary ? accent : "transparent";
      const border = isPrimary ? "none" : `2px solid ${accent}`;
      const pad = isPrimary ? "14px 16px" : "10px 16px";
      const minH = isPrimary ? "min-height:44px;" : "";
      const iconName = p.icon ? String(p.icon) : undefined;
      const iconHtml = iconName ? renderIcon(iconName, 16, fg) : "";
      const gap = iconHtml ? "gap:8px;" : "";
      return `<button onclick="showModal()" style="display:inline-flex;align-items:center;justify-content:center;${gap}width:100%;${minH}padding:${pad};border-radius:10px;background:${bg};color:${fg};border:${border};font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-sizing:border-box">${iconHtml}${esc(
        String(p.label ?? ""),
      )}</button>`;
    }
    case "text": {
      const size = String(p.size ?? "md");
      const weight = String(p.weight ?? "normal");
      const align = String(p.align ?? "left");
      const styles: Record<string, string> = {
        md: "font-size:15px;line-height:1.5",
        sm: "font-size:13px;line-height:1.5",
      };
      const weights: Record<string, string> = {
        bold: "font-weight:700",
        normal: "font-weight:400",
      };
      return `<div style="flex:1;${styles[size] ?? styles.md};${
        weights[weight] ?? weights.normal
      };color:#374151;text-align:${align}">${esc(
        String(p.content ?? ""),
      )}</div>`;
    }
    case "stack": {
      const direction = String(p.direction ?? "vertical");
      const isHorizontal = direction === "horizontal";
      const vGap: Record<string, string> = {
        none: "0",
        sm: "8px",
        md: "16px",
        lg: "24px",
      };
      const hGap: Record<string, string> = {
        none: "0",
        sm: "4px",
        md: "8px",
        lg: "12px",
      };
      const gapMap = isHorizontal ? hGap : vGap;
      const gapVal =
        gapMap[String(p.gap ?? "md")] ?? (isHorizontal ? "8px" : "16px");
      const dir = isHorizontal ? "row" : "column";
      const wrap = isHorizontal ? "flex-wrap:wrap;" : "";
      const align = isHorizontal ? "align-items:center;" : "";
      const justifyMap: Record<string, string> = {
        start: "flex-start",
        center: "center",
        end: "flex-end",
        between: "space-between",
        around: "space-around",
      };
      const jc = p.justify ? justifyMap[String(p.justify)] : undefined;
      const childIds = el.children ?? [];
      let html = `<div style="display:flex;width:100%;flex-direction:${dir};gap:${gapVal};${wrap}${align}${
        jc ? `justify-content:${jc};` : ""
      }">`;
      for (const childKey of childIds) {
        const flex = isHorizontal ? "flex:1;min-width:0;" : "";
        html += `<div style="${flex}">${renderElement(
          childKey,
          spec,
          accent,
        )}</div>`;
      }
      html += `</div>`;
      return html;
    }
    case "bar_chart": {
      const bars = Array.isArray(p.bars)
        ? (p.bars as Array<{ label?: string; value?: number; color?: string }>)
        : [];
      const chartColor = colorHex(p.color as string | undefined, accent);
      const maxVal =
        p.max != null
          ? Number(p.max)
          : Math.max(...bars.map((b) => Number(b.value ?? 0)), 1);
      let html = `<div style="display:flex;flex-direction:column;gap:8px;width:100%">`;
      for (const bar of bars) {
        const value = Number(bar.value ?? 0);
        const pct = maxVal > 0 ? Math.min(100, (value / maxVal) * 100) : 0;
        const fill = bar.color ? colorHex(bar.color, accent) : chartColor;
        html += `<div style="display:flex;align-items:center;gap:8px">`;
        html += `<span style="width:80px;flex-shrink:0;text-align:right;font-size:12px;color:#6B7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(
          String(bar.label ?? ""),
        )}</span>`;
        html += `<div style="flex:1;height:10px;background:#E5E7EB;border-radius:9999px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${fill};border-radius:9999px;transition:width 0.3s"></div></div>`;
        html += `<span style="width:32px;flex-shrink:0;font-size:12px;color:#6B7280;font-variant-numeric:tabular-nums">${value}</span>`;
        html += `</div>`;
      }
      html += `</div>`;
      return html;
    }
    case "cell_grid": {
      const cols = Number(p.cols ?? 2);
      const rows = Number(p.rows ?? 2);
      const cells = Array.isArray(p.cells)
        ? (p.cells as Array<{
            row?: number;
            col?: number;
            color?: string;
            content?: string;
          }>)
        : [];
      const gap = String(p.gap ?? "sm");
      const gapMap: Record<string, number> = { none: 0, sm: 1, md: 2, lg: 4 };
      const gapPx = gapMap[gap] ?? 1;
      const cellMap = new Map<string, { color?: string; content?: string }>();
      for (const c of cells) {
        cellMap.set(`${Number(c.row ?? 0)},${Number(c.col ?? 0)}`, {
          color: c.color,
          content: c.content,
        });
      }
      let html = `<div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${gapPx}px;width:100%">`;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cellMap.get(`${r},${c}`);
          const bg = cell?.color ? colorHex(cell.color, accent) : "transparent";
          const content = cell?.content ? esc(cell.content) : "";
          html += `<div style="min-height:28px;border:1px solid #E5E7EB;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#374151;background:${bg}">${content}</div>`;
        }
      }
      html += `</div>`;
      return html;
    }
    default:
      return "";
  }
}

// ─── Main renderer ──────────────────────────────────────

export function renderSnapPage(
  snap: SnapHandlerResult,
  snapOrigin: string,
  opts?: RenderSnapPageOptions,
): string {
  const spec = snap.ui as unknown as SnapSpec;
  const accent = accentHex(snap.theme?.accent);

  const meta = extractPageMeta(spec);
  const title = opts?.openGraph?.title ?? meta.title;
  const description = opts?.openGraph?.description ?? meta.description;
  const pageTitle = esc(title);
  const resourcePath = opts?.resourcePath ?? "/";
  const pageUrl = snapOrigin.replace(/\/$/, "") + resourcePath;
  const ogMeta = buildOgMeta({
    title,
    description,
    pageUrl,
    ogImageUrl: opts?.ogImageUrl,
    imageAlt: meta.imageAlt ?? meta.imageUrl ? title : undefined,
    siteName: opts?.siteName,
  });

  const snapUrl = encodeURIComponent(snapOrigin + "/");
  const bodyHtml = renderElement(spec.root, spec, accent);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pageTitle}</title>
${ogMeta}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0A0A0A;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px}
.card{background:#fff;border-radius:16px;max-width:420px;width:100%;padding:20px;box-shadow:0 4px 24px rgba(0,0,0,0.3)}
.card button:hover{filter:brightness(0.92)}
.foot{margin-top:16px;text-align:center}
.foot a{color:${accent};text-decoration:none;font-size:13px;display:inline-flex;align-items:center;gap:6px}
.foot a:hover{opacity:.8}
.foot svg{width:14px;height:12px}
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);align-items:center;justify-content:center;z-index:99}
.modal-box{background:#1A1A2E;border-radius:16px;padding:32px;text-align:center;max-width:340px;width:90%}
.modal-box svg{width:40px;height:35px;color:${accent};margin-bottom:16px}
.modal-box h2{color:#FAFAFA;font-size:20px;margin-bottom:8px}
.modal-box p{color:#A1A1AA;font-size:14px;line-height:1.5;margin-bottom:24px}
.modal-box a{display:block;padding:12px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:12px}
.mb-primary{background:${accent};color:${fgForBg(accent)}}
.mb-secondary{background:#1A1A2E;color:#FAFAFA;border:1px solid #2D2D44}
.modal-box a:hover{opacity:.85}
.modal-box button{background:none;border:none;color:#A1A1AA;cursor:pointer;font-size:13px;font-family:inherit}
</style>
</head>
<body>
<div class="card">
${bodyHtml}
</div>
<div class="foot">
<a href="https://farcaster.xyz">${FC_ICON} Farcaster</a>
</div>
<div class="modal" id="m" onclick="if(event.target===this)this.style.display='none'">
<div class="modal-box">
${FC_ICON}
<h2>Open in Farcaster</h2>
<p>Sign up or sign in to interact with this snap.</p>
<a href="https://farcaster.xyz" class="mb-primary">Sign up</a>
<a href="https://farcaster.xyz/~/developers/snaps?url=${snapUrl}" class="mb-secondary">Have an account? Try it</a>
<button onclick="document.getElementById('m').style.display='none'">Dismiss</button>
</div>
</div>
<script>function showModal(){document.getElementById('m').style.display='flex'}</script>
</body>
</html>`;
}
