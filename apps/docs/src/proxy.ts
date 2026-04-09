import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDocPathname, normalizeDocPathname } from "@/lib/docs-pages";
import { DEFAULT_VERSION } from "@/lib/version-config";

const VERSION_RE = /^\/([\d]+\.[\d]+)(\/|$)/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Markdown content negotiation ────────────────────────
  // When a client sends Accept: text/markdown, rewrite to the markdown-content route.
  if (request.method === "GET") {
    const accept = request.headers.get("accept") ?? "";

    if (accept.includes("text/markdown")) {
      // Strip version prefix if present to get the doc pathname
      const versionMatch = pathname.match(VERSION_RE);
      const docPath = versionMatch
        ? pathname.slice(versionMatch[0].length - 1) || "/"
        : pathname;
      const normalized = normalizeDocPathname(docPath);
      const version = versionMatch ? versionMatch[1] : DEFAULT_VERSION;

      if (isDocPathname(normalized, version)) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname =
          normalized === "/"
            ? "/markdown-content"
            : `/markdown-content${normalized}`;
        rewriteUrl.searchParams.set("version", version);
        return NextResponse.rewrite(rewriteUrl);
      }
    }
  }

  // ── Version routing ─────────────────────────────────────
  // If the path already has a version prefix (e.g. /2.0/building), pass through.
  if (VERSION_RE.test(pathname)) {
    return NextResponse.next();
  }

  // Rewrite unversioned paths to the default version.
  // The browser URL stays clean (e.g. /snap/building) but internally
  // routes to /snap/1.0/building.
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_VERSION}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Explicit "/" needed due to Next.js basePath bug: https://github.com/vercel/next.js/issues/73786
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico|llms\\.txt|markdown-content|opengraph-image|icon\\.svg|SKILL\\.md).*)"],
};
