import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_PAGE_TXT = join(dirname(fileURLToPath(import.meta.url)), "page.txt");

export async function GET() {
  const body = readFileSync(SKILL_PAGE_TXT, "utf-8");
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
