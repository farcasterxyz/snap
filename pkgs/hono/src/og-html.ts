import {
  ELEMENT_TYPE,
  TEXT_STYLE,
  type SnapPage,
} from "@farcaster/snap";

export type PageMeta = {
  title: string;
  description: string;
  imageUrl?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Derive OG title, description, and optional image URL from the first snap page.
 */
export function extractPageMeta(page: SnapPage): PageMeta {
  let title = "";
  let description = "";
  let imageUrl: string | undefined;

  for (const el of page.elements.children) {
    if (el.type === ELEMENT_TYPE.text) {
      if (!title && el.style === TEXT_STYLE.title) title = el.content;
      else if (!description && el.style === TEXT_STYLE.body)
        description = el.content;
      else if (!description && el.style === TEXT_STYLE.caption)
        description = el.content;
    } else if (el.type === ELEMENT_TYPE.image && !imageUrl) {
      imageUrl = el.url;
    }
  }

  if (!title) title = "Farcaster Snap";
  if (!description) description = "";

  return { title, description, imageUrl };
}

export function generateOgHtml(input: {
  page: SnapPage;
  ogImageUrl: string;
  pageUrl: string;
  fallbackText: string;
}): string {
  const { title, description } = extractPageMeta(input.page);
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(input.ogImageUrl);
  const url = escapeHtml(input.pageUrl);
  const body = escapeHtml(input.fallbackText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t}</title>
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${img}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${img}">
</head>
<body>
<p>${body}</p>
</body>
</html>`;
}
