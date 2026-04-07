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

  const pathname = normalizeDocPathname(request.nextUrl.pathname);

  if (!isDocPathname(pathname)) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname =
    pathname === "/" ? "/markdown-content" : `/markdown-content${pathname}`;

  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  // Explicit "/" needed due to Next.js basePath bug: https://github.com/vercel/next.js/issues/73786
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
