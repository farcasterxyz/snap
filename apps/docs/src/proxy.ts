import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDocPathname, normalizeDocPathname } from "@/lib/docs-pages";

export function proxy(request: NextRequest) {
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
  matcher: ["/((?!_next|.*\\..*).*)"],
};
