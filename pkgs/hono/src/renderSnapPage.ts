import type { SnapHandlerResult } from "@farcaster/snap";

const PALETTE: Record<string, string> = {
  gray: "#8F8F8F",
  blue: "#006BFF",
  red: "#FC0036",
  amber: "#FFAE00",
  green: "#28A948",
  teal: "#00AC96",
  purple: "#8B5CF6",
  pink: "#F32782",
};

const FC_ICON = `<svg viewBox="0 0 520 457" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M519.801 0V61.6809H458.172V123.31H477.054V123.331H519.801V456.795H416.57L416.507 456.49L363.832 207.03C358.81 183.251 345.667 161.736 326.827 146.434C307.988 131.133 284.255 122.71 260.006 122.71H259.8C235.551 122.71 211.818 131.133 192.979 146.434C174.139 161.736 160.996 183.259 155.974 207.03L103.239 456.795H0V123.323H42.7471V123.31H61.6262V61.6809H0V0H519.801Z" fill="currentColor"/></svg>`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function accentHex(accent: string | undefined): string {
  return PALETTE[accent ?? "purple"] ?? PALETTE.purple!;
}

function colorHex(color: string | undefined, accent: string): string {
  if (!color || color === "accent") return accent;
  return PALETTE[color] ?? accent;
}

// ─── Element renderers ──────────────────────────────────

function renderElement(el: Record<string, unknown>, accent: string): string {
  const type = el.type as string;
  switch (type) {
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
    case "spacer": {
      const sizes: Record<string, string> = {
        small: "8px",
        medium: "16px",
        large: "24px",
      };
      return `<div style="height:${
        sizes[(el.size as string) ?? "medium"] ?? "16px"
      }"></div>`;
    }
    default:
      return "";
  }
}

function renderText(el: Record<string, unknown>, _accent: string): string {
  const style = el.style as string;
  const content = esc(el.content as string);
  const align = (el.align as string) ?? "left";
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

function renderImage(el: Record<string, unknown>): string {
  const url = esc(el.url as string);
  const aspect = (el.aspect as string) ?? "16:9";
  const [w, h] = aspect.split(":").map(Number);
  const ratio = w && h ? `${w}/${h}` : "16/9";
  return `<div style="aspect-ratio:${ratio};border-radius:8px;overflow:hidden;background:#F3F4F6"><img src="${url}" alt="${esc(
    (el.alt as string) ?? "",
  )}" style="width:100%;height:100%;object-fit:cover"></div>`;
}

function renderGrid(el: Record<string, unknown>): string {
  const cols = el.cols as number;
  const rows = el.rows as number;
  const cells = el.cells as Array<{
    row: number;
    col: number;
    color?: string;
    content?: string;
  }>;
  const cellSize = (el.cellSize as string) ?? "auto";
  const gap = (el.gap as string) ?? "small";
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

function renderProgress(el: Record<string, unknown>, accent: string): string {
  const value = el.value as number;
  const max = el.max as number;
  const label = el.label as string | undefined;
  const color = colorHex(el.color as string | undefined, accent);
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const labelHtml = label
    ? `<div style="font-size:13px;color:#6B7280;margin-bottom:4px">${esc(
        label,
      )}</div>`
    : "";
  return `<div>${labelHtml}<div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color};border-radius:4px"></div></div></div>`;
}

function renderBarChart(el: Record<string, unknown>, accent: string): string {
  const bars = el.bars as Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  const max =
    (el.max as number | undefined) ?? Math.max(...bars.map((b) => b.value), 1);
  const defaultColor = colorHex(el.color as string | undefined, accent);

  let html = `<div style="display:flex;align-items:flex-end;gap:12px;height:120px">`;
  for (const bar of bars) {
    const color = bar.color ? PALETTE[bar.color] ?? defaultColor : defaultColor;
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

function renderList(el: Record<string, unknown>): string {
  const style = (el.style as string) ?? "ordered";
  const items = el.items as Array<{
    content: string;
    trailing?: string;
  }>;

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
  el: Record<string, unknown>,
  accent: string,
): string {
  const options = el.options as string[];
  const layout = (el.style as string) ?? "row";
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

function renderSlider(el: Record<string, unknown>, accent: string): string {
  const label = el.label as string | undefined;
  const min = el.min as number;
  const max = el.max as number;
  const value = (el.value as number) ?? (min + max) / 2;
  const minLabel = el.minLabel as string | undefined;
  const maxLabel = el.maxLabel as string | undefined;

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

function renderTextInput(el: Record<string, unknown>): string {
  const placeholder = esc((el.placeholder as string) ?? "");
  return `<input type="text" placeholder="${placeholder}" disabled style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid #E5E7EB;background:#F9FAFB;font-size:14px;color:#9CA3AF;font-family:inherit;box-sizing:border-box">`;
}

function renderToggle(el: Record<string, unknown>, accent: string): string {
  const label = esc(el.label as string);
  const value = el.value as boolean;
  const bg = value ? accent : "#D1D5DB";
  const tx = value ? "20px" : "2px";
  return `<div style="display:flex;align-items:center;justify-content:space-between">
<span style="font-size:14px;color:#374151">${label}</span>
<div style="width:44px;height:24px;background:${bg};border-radius:12px;position:relative;opacity:0.7"><div style="width:20px;height:20px;background:#fff;border-radius:50%;position:absolute;top:2px;left:${tx};transition:left .2s"></div></div>
</div>`;
}

function renderGroup(el: Record<string, unknown>, accent: string): string {
  const children = el.children as Array<Record<string, unknown>>;
  let html = `<div style="display:flex;gap:12px">`;
  for (const child of children) {
    html += `<div style="flex:1">${renderElement(child, accent)}</div>`;
  }
  html += `</div>`;
  return html;
}

// ─── Buttons ────────────────────────────────────────────

function renderButtons(
  buttons: Array<Record<string, unknown>> | undefined,
  layout: string | undefined,
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
    const btn = buttons[i]!;
    const label = esc(btn.label as string);
    const style = (btn.style as string) ?? (i === 0 ? "primary" : "secondary");
    const bg = style === "primary" ? accent : "transparent";
    const color = style === "primary" ? "#fff" : accent;
    const border = style === "primary" ? "none" : `2px solid ${accent}`;
    html += `<button onclick="showModal()" style="flex:1;padding:10px 16px;border-radius:10px;background:${bg};color:${color};border:${border};font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">${label}</button>`;
  }
  html += `</div>`;
  return html;
}

// ─── Main renderer ──────────────────────────────────────

export function renderSnapPage(
  snap: SnapHandlerResult,
  snapOrigin: string,
): string {
  const page = snap.page;
  const accent = accentHex(page.theme?.accent);

  // Extract title for <title> tag
  const titleEl = page.elements.children.find(
    (el) =>
      el.type === "text" && (el as Record<string, unknown>).style === "title",
  ) as Record<string, unknown> | undefined;
  const pageTitle = titleEl ? esc(titleEl.content as string) : "Farcaster Snap";

  const snapUrl = encodeURIComponent(snapOrigin + "/");

  // Render elements
  let elementsHtml = "";
  for (const el of page.elements.children) {
    elementsHtml += `<div style="margin-bottom:12px">${renderElement(
      el as Record<string, unknown>,
      accent,
    )}</div>`;
  }

  // Render buttons
  const buttonsHtml = renderButtons(
    page.buttons as Array<Record<string, unknown>> | undefined,
    page.button_layout as string | undefined,
    accent,
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pageTitle}</title>
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
