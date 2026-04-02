import { readFileSync } from "fs";
import { join } from "path";

const DOCS_DIR = join(process.cwd(), "src/app/docs");

const PAGES = [
  { file: "page.mdx", title: "Introduction" },
  { file: "elements/page.mdx", title: "Elements" },
  { file: "buttons/page.mdx", title: "Buttons" },
  { file: "actions/page.mdx", title: "Actions" },
  { file: "colors/page.mdx", title: "Color Palette" },
  { file: "theme/page.mdx", title: "Theme & Styling" },
  { file: "effects/page.mdx", title: "Effects" },
  { file: "constraints/page.mdx", title: "Constraints" },
  { file: "building/page.mdx", title: "Building a Snap" },
  { file: "existing-site/page.mdx", title: "Adding a Snap to an Existing Website" },
  { file: "auth/page.mdx", title: "Authentication" },
  { file: "examples/page.mdx", title: "Examples" },
];

export async function GET() {
  const sections: string[] = [
    "# Farcaster Snaps Documentation",
    "",
    "> This file aggregates all Farcaster Snaps documentation for LLM consumption.",
    "> Source: https://snap.farcaster.xyz/docs",
    "",
  ];

  for (const page of PAGES) {
    try {
      const content = readFileSync(join(DOCS_DIR, page.file), "utf-8");
      // Strip JSX/HTML blocks that won't help LLMs (like palette swatches)
      const cleaned = content
        .replace(/<div className="palette-grid">[\s\S]*?<\/div>/g, "[See color palette table on docs site]")
        .trim();
      sections.push(`---\n\n## ${page.title}\n\n${cleaned}\n`);
    } catch {
      // Skip missing files
    }
  }

  return new Response(sections.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
