import { getAllDocsMarkdown } from "@/lib/docs-markdown";
import { DEFAULT_VERSION, isValidVersion } from "@/lib/version-config";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const versionParam = request.nextUrl.searchParams.get("version") ?? DEFAULT_VERSION;
  const version = isValidVersion(versionParam) ? versionParam : DEFAULT_VERSION;
  return new Response(getAllDocsMarkdown(version), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
