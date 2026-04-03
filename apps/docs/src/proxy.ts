import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDocPathname, normalizeDocPathname } from "@/lib/docs-pages";

const CANONICAL_SKILL_PATH = "/SKILL.md";

function stripTrailingSlash(pathname: string): string {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function proxy(request: NextRequest) {
  const skillPathname = stripTrailingSlash(request.nextUrl.pathname);
  if (
    skillPathname.toLowerCase() === CANONICAL_SKILL_PATH.toLowerCase() &&
    skillPathname !== CANONICAL_SKILL_PATH
  ) {
    const url = request.nextUrl.clone();
    url.pathname = CANONICAL_SKILL_PATH;
    return NextResponse.rewrite(url);
  }

  if (request.method !== "GET") {
    return NextResponse.next();
  }

  const accept = request.headers.get("accept") ?? "";

  if (!accept.includes("text/markdown")) {
    return NextResponse.next();
  }

  if (!isDocPathname(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  const pathname = normalizeDocPathname(request.nextUrl.pathname);

  rewriteUrl.pathname =
    pathname === "/" ? "/markdown-content" : `/markdown-content${pathname}`;

  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: [
    // Doc HTML pages (paths without a dot; excludes /SKILL.md).
    "/((?!_next|.*\\..*).*)",
    // Single-segment paths such as /SKILL.md (any casing) for case-insensitive rewrite.
    "/:segment",
  ],
};
