import { readFileSync } from "fs";
import { join } from "path";
import {
  DOC_SECTIONS,
  docPathnameToMdxFile,
  getDocPageByPathname,
  getDocSectionsForVersion,
} from "@/lib/docs-pages";
import { DEFAULT_VERSION } from "@/lib/version-config";

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

export function getDocMarkdownByPathname(
  pathname: string,
  version: string = DEFAULT_VERSION,
): string | null {
  const page = getDocPageByPathname(pathname, version);

  if (!page) {
    return null;
  }

  return readDocMarkdown(docPathnameToMdxFile(page.pathname, version));
}

export function getAllDocsMarkdown(
  version: string = DEFAULT_VERSION,
): string {
  const sections: string[] = [
    "# Farcaster Snap Documentation",
    "",
    `> This file aggregates all Farcaster Snap documentation (${version}) for LLM consumption.`,
    "> Source: https://docs.farcaster.xyz/snap/",
    "",
  ];

  const docSections = getDocSectionsForVersion(version);

  for (const section of docSections) {
    for (const page of section.pages) {
      try {
        sections.push(
          `---\n\n## ${page.title}\n\n${readDocMarkdown(
            docPathnameToMdxFile(page.pathname, version),
          )}\n`,
        );
      } catch {
        // Skip missing files.
      }
    }
  }

  return sections.join("\n");
}
