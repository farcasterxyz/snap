import { getAllDocsMarkdown } from "@/lib/docs-markdown";

export async function GET() {
  return new Response(getAllDocsMarkdown(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
