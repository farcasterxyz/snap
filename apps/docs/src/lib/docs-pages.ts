export type DocPage = {
  pathname: string;
  title: string;
};

export type DocSection = {
  title: string;
  pages: DocPage[];
};

/** Route group folder under `src/app/(docs)/` for each sidebar section (URLs unchanged). */
const SECTION_APP_FOLDER: Record<string, string> = {
  Learn: "(learn)",
  Create: "(create)",
  Integrate: "(integrate)",
  Reference: "(spec)",
  Agents: "(learn)",
};

export const DOC_SECTIONS: DocSection[] = [
  {
    title: "Learn",
    pages: [
      { pathname: "/", title: "Introduction" },
      { pathname: "/examples", title: "Examples" },
    ],
  },
  {
    title: "Create",
    pages: [{ pathname: "/building", title: "Building a Snap" }],
  },
  {
    title: "Integrate",
    pages: [
      {
        pathname: "/existing-site",
        title: "Adding a Snap to an Existing Website",
      },
    ],
  },
  {
    title: "Reference",
    pages: [
      { pathname: "/elements", title: "Elements" },
      { pathname: "/buttons", title: "Buttons" },
      { pathname: "/actions", title: "Actions" },
      { pathname: "/effects", title: "Effects" },
      { pathname: "/constraints", title: "Constraints" },
      { pathname: "/theme", title: "Theme & Styling" },
      { pathname: "/colors", title: "Color Palette" },
      { pathname: "/auth", title: "Authentication" },
    ],
  },
  {
    title: "Agents",
    pages: [{ pathname: "/agents", title: "Agents" }],
  },
];

export function normalizeDocPathname(pathname: string): string {
  if (pathname === "") {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

/** Relative path under `src/app/(docs)/` for the page's MDX source. */
export function docPathnameToMdxFile(pathname: string): string {
  const normalized = normalizeDocPathname(pathname);

  for (const section of DOC_SECTIONS) {
    const folder = SECTION_APP_FOLDER[section.title];
    if (!folder) {
      throw new Error(`No app folder mapped for section: ${section.title}`);
    }
    for (const page of section.pages) {
      if (normalizeDocPathname(page.pathname) !== normalized) {
        continue;
      }
      if (normalized === "/") {
        return `${folder}/page.mdx`;
      }
      return `${folder}/${page.pathname.slice(1)}/page.mdx`;
    }
  }

  throw new Error(`Unknown doc pathname: ${pathname}`);
}

export function getDocPageByPathname(pathname: string): DocPage | null {
  const normalizedPathname = normalizeDocPathname(pathname);

  for (const section of DOC_SECTIONS) {
    const page = section.pages.find((p) => p.pathname === normalizedPathname);
    if (page) {
      return page;
    }
  }

  return null;
}

export function isDocPathname(pathname: string): boolean {
  return getDocPageByPathname(pathname) !== null;
}
