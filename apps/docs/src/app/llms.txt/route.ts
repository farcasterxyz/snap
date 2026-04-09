import { getAllDocsMarkdown } from "@/lib/docs-markdown";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const version = request.nextUrl.searchParams.get("version") ?? undefined;
  return new Response(getAllDocsMarkdown(version), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
