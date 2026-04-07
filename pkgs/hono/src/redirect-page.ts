import type { SnapHandlerResult, SnapSpec } from "@farcaster/snap";
import { extractPageMeta, buildOgMeta, esc } from "./renderSnapPage";

const SNAP_PREVIEW_BASE = "https://farcaster.xyz/~/snap-preview";

const FC_ICON = `<svg viewBox="0 0 520 457" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M519.801 0V61.6809H458.172V123.31H477.054V123.331H519.801V456.795H416.57L416.507 456.49L363.832 207.03C358.81 183.251 345.667 161.736 326.827 146.434C307.988 131.133 284.255 122.71 260.006 122.71H259.8C235.551 122.71 211.818 131.133 192.979 146.434C174.139 161.736 160.996 183.259 155.974 207.03L103.239 456.795H0V123.323H42.7471V123.31H61.6262V61.6809H0V0H519.801Z" fill="currentColor"/></svg>`;

export type SnapRedirectOptions = {
  ogImageUrl?: string;
  resourcePath?: string;
  siteName?: string;
};

/**
 * Returns an HTML page with OG meta tags (for crawlers) and an immediate
 * redirect to farcaster.xyz/~/snap-preview where the snap renders with
 * real React components.
 */
export function snapRedirectHtml(
  snapOrigin: string,
  snap: SnapHandlerResult,
  opts?: SnapRedirectOptions,
): string {
  const spec = snap.ui as unknown as SnapSpec;
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

  const snapUrl = snapOrigin.replace(/\/$/, "") + "/";
  const previewUrl = `${SNAP_PREVIEW_BASE}?url=${encodeURIComponent(snapUrl)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pageTitle}</title>
${ogMeta}
<meta http-equiv="refresh" content="0;url=${esc(previewUrl)}">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0A0A0A;color:#FAFAFA;min-height:100vh;display:flex;align-items:center;justify-content:center}
.c{text-align:center;max-width:400px;padding:48px 32px}
.logo{color:#8B5CF6;margin-bottom:24px}
.logo svg{width:48px;height:42px}
p{color:#A1A1AA;font-size:15px;line-height:1.5;margin-bottom:24px}
a{color:#8B5CF6;text-decoration:none}
a:hover{opacity:.8}
</style>
</head>
<body>
<div class="c">
<div class="logo">${FC_ICON}</div>
<p>Opening in Farcaster&hellip;</p>
<a href="${esc(previewUrl)}">Click here if you are not redirected</a>
</div>
<script>window.location.href=${JSON.stringify(previewUrl)}</script>
</body>
</html>`;
}
