const FARCASTER_ICON_SVG = `<svg aria-hidden="true" focusable="false" viewBox="0 0 520 457" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M519.801 0V61.6809H458.172V123.31H477.054V123.331H519.801V456.795H416.57L416.507 456.49L363.832 207.03C358.81 183.251 345.667 161.736 326.827 146.434C307.988 131.133 284.255 122.71 260.006 122.71H259.8C235.551 122.71 211.818 131.133 192.979 146.434C174.139 161.736 160.996 183.259 155.974 207.03L103.239 456.795H0V123.323H42.7471V123.31H61.6262V61.6809H0V0H519.801Z" fill="currentColor"/></svg>`;

const DEFAULT_BRANDED_TITLE = "Farcaster Snap";
const DEFAULT_BRANDED_DESCRIPTION = "An interactive embed for Farcaster.";

export function brandedFallbackHtml(
  snapOrigin: string,
  og?: {
    ogImageUrl?: string;
    resourcePath?: string;
    siteName?: string;
    title?: string;
    description?: string;
  },
): string {
  const snapUrl = encodeURIComponent(snapOrigin + "/");
  const testUrl = `https://farcaster.xyz/~/developers/snaps?url=${snapUrl}`;
  const pageUrl = snapOrigin + (og?.resourcePath ?? "/");
  const pageTitle = og?.title ?? DEFAULT_BRANDED_TITLE;
  const pageDescription = og?.description ?? DEFAULT_BRANDED_DESCRIPTION;

  const ogLines = [
    `<meta name="description" content="${escHtml(pageDescription)}">`,
    `<meta property="og:title" content="${escHtml(pageTitle)}">`,
    `<meta property="og:description" content="${escHtml(pageDescription)}">`,
    `<meta property="og:url" content="${escHtml(pageUrl)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="en_US">`,
  ];
  if (og?.siteName) {
    ogLines.push(
      `<meta property="og:site_name" content="${escHtml(og.siteName)}">`,
    );
  }
  if (og?.ogImageUrl) {
    ogLines.push(
      `<meta property="og:image" content="${escHtml(og.ogImageUrl)}">`,
      `<meta name="twitter:image" content="${escHtml(og.ogImageUrl)}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
    );
  } else {
    ogLines.push(`<meta name="twitter:card" content="summary">`);
  }
  ogLines.push(
    `<meta name="twitter:title" content="${escHtml(pageTitle)}">`,
    `<meta name="twitter:description" content="${escHtml(pageDescription)}">`,
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(pageTitle)}</title>
${ogLines.join("\n")}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0A0A0A;color:#FAFAFA;min-height:100vh;display:flex;align-items:center;justify-content:center}
.c{text-align:center;max-width:400px;padding:48px 32px}
.logo{color:#8B5CF6;margin-bottom:24px}
.logo svg{width:48px;height:42px}
h1{font-size:24px;font-weight:700;margin-bottom:8px}
p{color:#A1A1AA;font-size:15px;line-height:1.5;margin-bottom:32px}
.btns{display:flex;flex-direction:column;gap:12px}
a{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;transition:opacity .15s}
a:hover{opacity:.85}
.p{background:#8B5CF6;color:#fff}
.s{background:#1A1A2E;color:#FAFAFA;border:1px solid #2D2D44}
.s svg{width:20px;height:18px}
</style>
</head>
<body>
<div class="c">
<div class="logo">${FARCASTER_ICON_SVG}</div>
<h1>Farcaster Snap</h1>
<p>This is a Farcaster Snap &mdash; an interactive embed that lives in the feed.</p>
<div class="btns">
<a href="${testUrl}" class="p">Test this snap</a>
<a href="https://farcaster.xyz" class="s">${FARCASTER_ICON_SVG} Sign up for Farcaster</a>
</div>
</div>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
