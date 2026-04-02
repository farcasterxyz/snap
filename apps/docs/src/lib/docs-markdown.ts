import { readFileSync } from "fs";
import { join } from "path";
import { DOC_PAGES, getDocPageByPathname } from "@/lib/docs-pages";

const DOCS_DIR = join(process.cwd(), "src/app/(docs)");
const INTERACTIVE_PREVIEW_PLACEHOLDER = "[Interactive preview on docs site]";

function sanitizeDocMarkdown(content: string): string {
  const withoutPaletteGrid = content.replace(
    /<div className="palette-grid">[\s\S]*?<\/div>/g,
    "[See color palette table on docs site]",
  );

  const cleanedLines: string[] = [];
  let inCodeFence = false;

  for (const line of withoutPaletteGrid.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      inCodeFence = !inCodeFence;
      cleanedLines.push(line);
      continue;
    }

    if (inCodeFence) {
      cleanedLines.push(line);
      continue;
    }

    const withoutInteractiveComponent = line.replace(
      /<([A-Z][A-Za-z0-9]*)[^>]*\/>/g,
      INTERACTIVE_PREVIEW_PLACEHOLDER,
    );
    const withoutHtml = withoutInteractiveComponent.replace(
      /<\/?([A-Za-z][A-Za-z0-9-]*)(\s[^>]*)?>/g,
      "",
    );

    cleanedLines.push(withoutHtml.trimEnd());
  }

  return cleanedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function readDocMarkdown(file: string): string {
  const content = readFileSync(join(DOCS_DIR, file), "utf-8");

  return sanitizeDocMarkdown(content);
}

export function getDocMarkdownByPathname(pathname: string): string | null {
  const page = getDocPageByPathname(pathname);

  if (!page) {
    return null;
  }

  return readDocMarkdown(page.file);
}

export function getAllDocsMarkdown(): string {
  const sections: string[] = [
    "# Farcaster Snaps Documentation",
    "",
    "> This file aggregates all Farcaster Snaps documentation for LLM consumption.",
    "> Source: https://snap.farcaster.xyz/",
    "",
  ];

  for (const page of DOC_PAGES) {
    try {
      sections.push(
        `---\n\n## ${page.title}\n\n${readDocMarkdown(page.file)}\n`,
      );
    } catch {
      // Skip missing files.
    }
  }

  return sections.join("\n");
}
