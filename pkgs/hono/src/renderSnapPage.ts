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
    if (e.type === "image" && !imageUrl) {
      imageUrl = e.props?.url ? String(e.props.url) : undefined;
      imageAlt = e.props?.alt ? String(e.props.alt) : undefined;
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
    lines.push(`<meta property="og:image:alt" content="${esc(imageAlt ?? title)}">`);
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
  color: string | undefined,
  accent: string,
): string {
  if (!color || color === PALETTE_COLOR_ACCENT) return accent;
  return (PALETTE_LIGHT_HEX as Record<string, string>)[color] ?? accent;
}

// ─── Element renderers ──────────────────────────────────

function renderElement(
  key: string,
  spec: SnapSpec,
  accent: string,
): string {
  const el = spec.elements[key] as SnapUIElement | undefined;
  if (!el) return "";
  const p = el.props ?? {};

  switch (el.type) {
    case "icon": {
      const color = colorHex(p.color as string | undefined, accent);
      const size = String(p.size ?? "md") === "sm" ? 16 : 20;
      // Simplified inline SVG for common icons; falls back to a circle for unknown
      const name = String(p.name ?? "info");
      const iconSvgs: Record<string, string> = {
        check: `<polyline points="20 6 9 17 4 12"/>`,
        x: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
        heart: `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`,
        star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
        info: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`,
        "arrow-right": `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,
        "chevron-right": `<polyline points="9 18 15 12 9 6"/>`,
        "external-link": `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>`,
        zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
        user: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
        clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
      };
      const inner = iconSvgs[name] ?? `<circle cx="12" cy="12" r="4"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle">${inner}</svg>`;
    }
    case "badge": {
      const color = colorHex(p.color as string | undefined, accent);
      return `<span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500;line-height:1.5;background:${color};color:#fff">${esc(String(p.label ?? ""))}</span>`;
    }
    case "image": {
      const url = esc(String(p.url ?? ""));
      const aspect = String(p.aspect ?? "16:9");
      const [w, h] = aspect.split(":").map(Number);
      const ratio = w && h ? `${w}/${h}` : "16/9";
      return `<div style="aspect-ratio:${ratio};border-radius:8px;overflow:hidden;background:#F3F4F6"><img src="${url}" alt="${esc(String(p.alt ?? ""))}" style="width:100%;height:100%;object-fit:cover"></div>`;
    }
    case "item": {
      const variant = String(p.variant ?? "default");
      const variantStyles: Record<string, string> = {
        default: "",
        outline: "border:1px solid #E5E7EB;border-radius:8px;padding:12px;",
        muted: "background:#F9FAFB;border-radius:8px;padding:12px;",
      };
      const descHtml = p.description ? `<div style="font-size:13px;color:#6B7280;margin-top:2px">${esc(String(p.description))}</div>` : "";
      const childIds = el.children ?? [];
      const actionsHtml = childIds.length > 0
        ? `<div style="margin-left:auto;padding-left:12px;display:flex;align-items:center;gap:4px">${childIds.map((id) => renderElement(id, spec, accent)).join("")}</div>`
        : "";
      return `<div style="display:flex;align-items:flex-start;${variantStyles[variant] ?? ""}"><div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:500;color:#111">${esc(String(p.title ?? ""))}</div>${descHtml}</div>${actionsHtml}</div>`;
    }
    case "item_group": {
      const childIds = el.children ?? [];
      const border = Boolean(p.border);
      const separator = Boolean(p.separator);
      const outerStyle = border ? "border:1px solid #E5E7EB;border-radius:8px;overflow:hidden" : "";
      let html = `<div style="display:flex;flex-direction:column;${outerStyle}">`;
      for (let i = 0; i < childIds.length; i++) {
        if (separator && i > 0) {
          html += `<hr style="border:none;border-top:1px solid #E5E7EB;margin:0 12px">`;
        }
        const pad = border ? "padding:8px 12px;" : separator ? "padding:8px 0;" : "";
        html += `<div style="${pad}">${renderElement(childIds[i]!, spec, accent)}</div>`;
      }
      html += `</div>`;
      return html;
    }
    case "progress": {
      const value = Number(p.value ?? 0);
      const max = Number(p.max ?? 100);
      const color = accent;
      const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
      const labelHtml = p.label ? `<div style="font-size:13px;color:#6B7280;margin-bottom:4px">${esc(String(p.label))}</div>` : "";
      return `<div>${labelHtml}<div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color};border-radius:4px"></div></div></div>`;
    }
    case "separator": {
      const orientation = String(p.orientation ?? "horizontal");
      if (orientation === "vertical") return `<div style="width:1px;background:#E5E7EB;align-self:stretch;min-height:16px"></div>`;
      return `<hr style="border:none;border-top:1px solid #E5E7EB;margin:4px 0">`;
    }
    case "slider": {
      const min = Number(p.min ?? 0);
      const max = Number(p.max ?? 100);
      const value = p.defaultValue !== undefined ? Number(p.defaultValue) : (min + max) / 2;
      const labelHtml = p.label ? `<div style="font-size:13px;font-weight:500;color:#374151;margin-bottom:4px">${esc(String(p.label))}</div>` : "";
      return `<div>${labelHtml}<input type="range" min="${min}" max="${max}" value="${value}" disabled style="width:100%;accent-color:${accent};opacity:0.7"></div>`;
    }
    case "switch": {
      const checked = Boolean(p.defaultChecked);
      const bg = checked ? accent : "#D1D5DB";
      const tx = checked ? "20px" : "2px";
      return `<div style="display:flex;align-items:center;justify-content:space-between"><span style="font-size:14px;color:#374151">${esc(String(p.label ?? ""))}</span><div style="width:44px;height:24px;background:${bg};border-radius:12px;position:relative;opacity:0.7"><div style="width:20px;height:20px;background:#fff;border-radius:50%;position:absolute;top:2px;left:${tx}"></div></div></div>`;
    }
    case "input": {
      const labelHtml = p.label ? `<label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px">${esc(String(p.label))}</label>` : "";
      return `<div>${labelHtml}<input type="text" placeholder="${esc(String(p.placeholder ?? ""))}" disabled style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid #E5E7EB;background:#F9FAFB;font-size:14px;color:#9CA3AF;font-family:inherit;box-sizing:border-box"></div>`;
    }
    case "toggle_group": {
      const options = Array.isArray(p.options) ? p.options as string[] : [];
      const orientation = String(p.orientation ?? "horizontal");
      const dir = orientation === "vertical" ? "column" : "row";
      const labelHtml = p.label ? `<div style="font-size:13px;font-weight:500;color:#374151;margin-bottom:4px">${esc(String(p.label))}</div>` : "";
      let html = `<div>${labelHtml}<div style="display:flex;flex-direction:${dir};gap:4px;padding:4px;background:#F3F4F6;border-radius:8px">`;
      for (const opt of options) {
        html += `<button onclick="showModal()" style="flex:1;padding:8px 12px;border-radius:6px;border:none;background:#F3F4F6;font-size:13px;color:#374151;cursor:pointer;font-family:inherit">${esc(opt)}</button>`;
      }
      html += `</div></div>`;
      return html;
    }
    case "button": {
      const variant = String(p.variant ?? "default");
      const bg = variant === "default" ? accent : "transparent";
      const color = variant === "default" ? "#fff" : accent;
      const border = variant === "default" ? "none" : `2px solid ${accent}`;
      const pad = variant === "default" ? "18px 16px" : "10px 16px";
      const minH = variant === "default" ? "min-height:52px;" : "";
      return `<button onclick="showModal()" style="width:100%;${minH}padding:${pad};border-radius:10px;background:${bg};color:${color};border:${border};font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-sizing:border-box">${esc(String(p.label ?? ""))}</button>`;
    }
    case "text": {
      const size = String(p.size ?? "md");
      const weight = String(p.weight ?? (size === "lg" ? "bold" : "normal"));
      const align = String(p.align ?? "left");
      const styles: Record<string, string> = {
        lg: "font-size:20px",
        md: "font-size:15px;line-height:1.5",
        sm: "font-size:13px",
      };
      const weights: Record<string, string> = {
        bold: "font-weight:700",
        medium: "font-weight:500",
        normal: "font-weight:400",
      };
      return `<div style="${styles[size] ?? styles.md};${weights[weight] ?? weights.normal};color:#374151;text-align:${align}">${esc(String(p.content ?? ""))}</div>`;
    }
    case "stack": {
      const direction = String(p.direction ?? "vertical");
      const gap: Record<string, string> = { none: "0", sm: "4px", md: "8px", lg: "16px" };
      const gapVal = gap[String(p.gap ?? "md")] ?? "8px";
      const dir = direction === "horizontal" ? "row" : "column";
      const childIds = el.children ?? [];
      let html = `<div style="display:flex;flex-direction:${dir};gap:${gapVal}">`;
      for (const childKey of childIds) {
        const flex = direction === "horizontal" ? "flex:1;" : "";
        html += `<div style="${flex}">${renderElement(childKey, spec, accent)}</div>`;
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
  const spec = snap.spec as unknown as SnapSpec;
  const accent = accentHex(snap.theme?.accent);

  const meta = extractPageMeta(spec);
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
