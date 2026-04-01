import type {
  SnapPageElementInput,
  SnapHandlerResult,
  PaletteColor,
} from "@farcaster/snap";
import {
  DEFAULT_THEME_ACCENT,
  PALETTE_LIGHT_HEX,
  PALETTE_COLOR_ACCENT,
} from "@farcaster/snap";

type SnapPage = SnapHandlerResult["page"];
type SnapPageButton = NonNullable<SnapPage["buttons"]>[number];

// ─── OG meta ────────────────────────────────────────────

export type RenderSnapPageOptions = {
  /** Absolute URL of the /~/og-image PNG route. */
  ogImageUrl?: string;
  /** Canonical pathname + search of the snap page (e.g. "/snap" or "/"). */
  resourcePath?: string;
  /** Optional og:site_name value (e.g. from SNAP_OG_SITE_NAME env). */
  siteName?: string;
};

type PageMeta = {
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
};

export function extractPageMeta(page: SnapPage): PageMeta {
  let title = "Farcaster Snap";
  let description = "";
  let imageUrl: string | undefined;
  let imageAlt: string | undefined;

  for (const el of page.elements.children) {
    if (el.type === "text") {
      const style = el.style;
      const content = el.content;
      if (style === "title" && title === "Farcaster Snap" && content) {
        title = content;
      } else if (
        (style === "body" || style === "caption") &&
        !description &&
        content
      ) {
        description = content;
      }
    }
    if (el.type === "image" && !imageUrl) {
      imageUrl = el.url;
      imageAlt = el.alt;
    }
  }

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

function colorHex(
  color: PaletteColor | typeof PALETTE_COLOR_ACCENT | undefined,
  accent: string,
): string {
  if (!color || color === PALETTE_COLOR_ACCENT) return accent;
  return PALETTE_LIGHT_HEX[color] ?? accent;
}

// ─── Element renderers ──────────────────────────────────

function renderElement(el: SnapPageElementInput, accent: string): string {
  switch (el.type) {
    case "text":
      return renderText(el, accent);
    case "image":
      return renderImage(el);
    case "grid":
      return renderGrid(el);
    case "progress":
      return renderProgress(el, accent);
    case "bar_chart":
      return renderBarChart(el, accent);
    case "list":
      return renderList(el);
    case "button_group":
      return renderButtonGroup(el, accent);
    case "slider":
      return renderSlider(el, accent);
    case "text_input":
      return renderTextInput(el);
    case "toggle":
      return renderToggle(el, accent);
    case "group":
      return renderGroup(el, accent);
    case "divider":
      return `<hr style="border:none;border-top:1px solid #E5E7EB;margin:4px 0">`;
    case "spacer":
      return renderSpacer(el);
    default:
      return "";
  }
}

function renderText(
  el: Extract<SnapPageElementInput, { type: "text" }>,
  _accent: string,
): string {
  const style = el.style;
  const content = esc(el.content);
  const align = el.align ?? "left";
  const styles: Record<string, string> = {
    title: "font-size:20px;font-weight:700;color:#111",
    body: "font-size:15px;line-height:1.5;color:#374151",
    caption: "font-size:13px;color:#9CA3AF",
    label:
      "font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px",
  };
  return `<div style="${
    styles[style] ?? styles.body
  };text-align:${align}">${content}</div>`;
}

function renderImage(
  el: Extract<SnapPageElementInput, { type: "image" }>,
): string {
  const url = esc(el.url);
  const aspect = el.aspect ?? "16:9";
  const [w, h] = aspect.split(":").map(Number);
  const ratio = w && h ? `${w}/${h}` : "16/9";
  return `<div style="aspect-ratio:${ratio};border-radius:8px;overflow:hidden;background:#F3F4F6"><img src="${url}" alt="${esc(
    el.alt ?? "",
  )}" style="width:100%;height:100%;object-fit:cover"></div>`;
}

function renderGrid(
  el: Extract<SnapPageElementInput, { type: "grid" }>,
): string {
  const { cols, rows, cells } = el;
  const cellSize = el.cellSize ?? "auto";
  const gap = el.gap ?? "small";
  const gapPx: Record<string, string> = {
    none: "0",
    small: "2px",
    medium: "4px",
  };
  const cellMap = new Map<string, (typeof cells)[0]>();
  for (const c of cells) cellMap.set(`${c.row},${c.col}`, c);

  let cellsHtml = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cellMap.get(`${r},${c}`);
      const bg = cell?.color ?? "transparent";
      const content = cell?.content ? esc(cell.content) : "";
      const sq = cellSize === "square" ? "aspect-ratio:1;" : "";
      cellsHtml += `<div style="${sq}background:${bg};display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;border-radius:2px">${content}</div>`;
    }
  }

  return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${
    gapPx[gap] ?? "2px"
  }">${cellsHtml}</div>`;
}

function renderProgress(
  el: Extract<SnapPageElementInput, { type: "progress" }>,
  accent: string,
): string {
  const { value, max, label } = el;
  const color = colorHex(el.color, accent);
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const labelHtml = label
    ? `<div style="font-size:13px;color:#6B7280;margin-bottom:4px">${esc(
        label,
      )}</div>`
    : "";
  return `<div>${labelHtml}<div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color};border-radius:4px"></div></div></div>`;
}

function renderBarChart(
  el: Extract<SnapPageElementInput, { type: "bar_chart" }>,
  accent: string,
): string {
  const { bars } = el;
  const max =
    el.max ?? Math.max(...bars.map((b: { value: number }) => b.value), 1);
  const defaultColor = colorHex(el.color, accent);

  let html = `<div style="display:flex;align-items:flex-end;gap:12px;height:120px">`;
  for (const bar of bars) {
    const color = colorHex(bar.color, defaultColor);
    const pct = max > 0 ? (bar.value / max) * 100 : 0;
    html += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end">`;
    html += `<div style="font-size:11px;color:#6B7280;margin-bottom:4px">${bar.value}</div>`;
    html += `<div style="width:100%;height:${pct}%;background:${color};border-radius:4px 4px 0 0;min-height:4px"></div>`;
    html += `<div style="font-size:11px;color:#9CA3AF;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${esc(
      bar.label,
    )}</div>`;
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

function renderList(
  el: Extract<SnapPageElementInput, { type: "list" }>,
): string {
  const style = el.style ?? "ordered";
  const { items } = el;

  let html = "";
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const prefix =
      style === "ordered"
        ? `<span style="color:#9CA3AF;min-width:20px">${i + 1}.</span>`
        : style === "unordered"
        ? `<span style="color:#9CA3AF;min-width:20px">&bull;</span>`
        : "";
    const trailing = item.trailing
      ? `<span style="color:#9CA3AF;font-size:13px;white-space:nowrap">${esc(
          item.trailing,
        )}</span>`
      : "";
    html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0">${prefix}<span style="flex:1;font-size:14px;color:#374151">${esc(
      item.content,
    )}</span>${trailing}</div>`;
  }
  return `<div>${html}</div>`;
}

function renderButtonGroup(
  el: Extract<SnapPageElementInput, { type: "button_group" }>,
  accent: string,
): string {
  const { options } = el;
  const layout = el.style ?? "row";
  const dir = layout === "stack" ? "column" : "row";
  let html = `<div style="display:flex;flex-direction:${dir};gap:8px">`;
  for (const opt of options) {
    html += `<button onclick="showModal()" style="flex:1;padding:10px 12px;border-radius:8px;border:1px solid #E5E7EB;background:#fff;font-size:14px;color:#374151;cursor:pointer;font-family:inherit">${esc(
      opt,
    )}</button>`;
  }
  html += `</div>`;
  return html;
}

function renderSlider(
  el: Extract<SnapPageElementInput, { type: "slider" }>,
  accent: string,
): string {
  const { label, min, max, minLabel, maxLabel } = el;
  const value = el.value ?? (min + max) / 2;

  const labelHtml = label
    ? `<div style="font-size:13px;color:#6B7280;margin-bottom:4px">${esc(
        label,
      )}</div>`
    : "";
  const minL = minLabel
    ? `<span style="font-size:11px;color:#9CA3AF">${esc(minLabel)}</span>`
    : "";
  const maxL = maxLabel
    ? `<span style="font-size:11px;color:#9CA3AF">${esc(maxLabel)}</span>`
    : "";

  return `<div>${labelHtml}<div style="display:flex;align-items:center;gap:8px">${minL}<input type="range" min="${min}" max="${max}" value="${value}" disabled style="flex:1;accent-color:${accent};opacity:0.7">${maxL}</div></div>`;
}

function renderTextInput(
  el: Extract<SnapPageElementInput, { type: "text_input" }>,
): string {
  const placeholder = esc(el.placeholder ?? "");
  return `<input type="text" placeholder="${placeholder}" disabled style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid #E5E7EB;background:#F9FAFB;font-size:14px;color:#9CA3AF;font-family:inherit;box-sizing:border-box">`;
}

function renderToggle(
  el: Extract<SnapPageElementInput, { type: "toggle" }>,
  accent: string,
): string {
  const label = esc(el.label);
  const { value } = el;
  const bg = value ? accent : "#D1D5DB";
  const tx = value ? "20px" : "2px";
  return `<div style="display:flex;align-items:center;justify-content:space-between">
<span style="font-size:14px;color:#374151">${label}</span>
<div style="width:44px;height:24px;background:${bg};border-radius:12px;position:relative;opacity:0.7"><div style="width:20px;height:20px;background:#fff;border-radius:50%;position:absolute;top:2px;left:${tx};transition:left .2s"></div></div>
</div>`;
}

function renderSpacer(
  el: Extract<SnapPageElementInput, { type: "spacer" }>,
): string {
  const sizes: Record<string, string> = {
    small: "8px",
    medium: "16px",
    large: "24px",
  };
  return `<div style="height:${sizes[el.size ?? "medium"] ?? "16px"}"></div>`;
}

function renderGroup(
  el: Extract<SnapPageElementInput, { type: "group" }>,
  accent: string,
): string {
  let html = `<div style="display:flex;gap:12px">`;
  for (const child of el.children) {
    html += `<div style="flex:1">${renderElement(child, accent)}</div>`;
  }
  html += `</div>`;
  return html;
}

// ─── Buttons ────────────────────────────────────────────

function renderButtons(
  buttons: SnapPage["buttons"],
  layout: SnapPage["button_layout"],
  accent: string,
): string {
  if (!buttons || buttons.length === 0) return "";

  const dir =
    layout === "row"
      ? "flex-direction:row"
      : layout === "grid"
      ? "display:grid;grid-template-columns:1fr 1fr"
      : "flex-direction:column";
  const wrap =
    layout === "row"
      ? "display:flex;"
      : layout === "grid"
      ? ""
      : "display:flex;";

  let html = `<div style="${wrap}${dir};gap:8px;margin-top:12px">`;
  for (let i = 0; i < buttons.length; i++) {
    const btn: SnapPageButton = buttons[i]!;
    const label = esc(btn.label);
    const style = btn.style ?? (i === 0 ? "primary" : "secondary");
    const bg = style === "primary" ? accent : "transparent";
    const color = style === "primary" ? "#fff" : accent;
    const border = style === "primary" ? "none" : `2px solid ${accent}`;
    const pad = style === "primary" ? "18px 16px" : "10px 16px";
    const minH = style === "primary" ? "min-height:52px;" : "";
    html += `<button onclick="showModal()" style="flex:1;${minH}padding:${pad};border-radius:10px;background:${bg};color:${color};border:${border};font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-sizing:border-box">${label}</button>`;
  }
  html += `</div>`;
  return html;
}

// ─── Main renderer ──────────────────────────────────────

export function renderSnapPage(
  snap: SnapHandlerResult,
  snapOrigin: string,
  opts?: RenderSnapPageOptions,
): string {
  const page = snap.page;
  const accent = accentHex(page.theme?.accent);

  const meta = extractPageMeta(page);
  const pageTitle = esc(meta.title);
  const resourcePath = opts?.resourcePath ?? "/";
  const pageUrl = snapOrigin.replace(/\/$/, "") + resourcePath;
  const ogMeta = buildOgMeta({
    title: meta.title,
    description: meta.description,
    pageUrl,
    ogImageUrl: opts?.ogImageUrl,
    imageAlt: meta.imageAlt ?? meta.imageUrl ? meta.title : undefined,
    siteName: opts?.siteName,
  });

  const snapUrl = encodeURIComponent(snapOrigin + "/");

  // Render elements
  let elementsHtml = "";
  for (const el of page.elements.children) {
    elementsHtml += `<div style="margin-bottom:12px">${renderElement(
      el,
      accent,
    )}</div>`;
  }

  // Render buttons
  const buttonsHtml = renderButtons(page.buttons, page.button_layout, accent);

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
.foot{margin-top:16px;text-align:center}
.foot a{color:#8B5CF6;text-decoration:none;font-size:13px;display:inline-flex;align-items:center;gap:6px}
.foot a:hover{opacity:.8}
.foot svg{width:14px;height:12px}
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);align-items:center;justify-content:center;z-index:99}
.modal-box{background:#1A1A2E;border-radius:16px;padding:32px;text-align:center;max-width:340px;width:90%}
.modal-box svg{width:40px;height:35px;color:#8B5CF6;margin-bottom:16px}
.modal-box h2{color:#FAFAFA;font-size:20px;margin-bottom:8px}
.modal-box p{color:#A1A1AA;font-size:14px;line-height:1.5;margin-bottom:24px}
.modal-box a{display:block;padding:12px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:12px}
.mb-primary{background:#8B5CF6;color:#fff}
.mb-secondary{background:#1A1A2E;color:#FAFAFA;border:1px solid #2D2D44}
.modal-box a:hover{opacity:.85}
.modal-box button{background:none;border:none;color:#A1A1AA;cursor:pointer;font-size:13px;font-family:inherit}
</style>
</head>
<body>
<div class="card">
${elementsHtml}
${buttonsHtml}
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
