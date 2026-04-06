export type DocPage = {
  pathname: string;
  title: string;
};

export type DocSection = {
  title: string;
  /** When true, the section title is not rendered in the sidebar. */
  untitled?: boolean;
  pages: DocPage[];
};

/** Route group folder under `src/app/(docs)/` for each sidebar section (URLs unchanged). */
const SECTION_APP_FOLDER: Record<string, string> = {
  Home: "(learn)",
  Learn: "(learn)",
  "Snap Protocol": "(reference)",
};

export const DOC_SECTIONS: DocSection[] = [
  {
    title: "Home",
    untitled: true,
    pages: [
      { pathname: "/", title: "Home" },
      { pathname: "/agents", title: "Building Snaps with AI" },
    ],
  },
  {
    title: "Learn",
    pages: [
      { pathname: "/building", title: "Building a Snap" },
      { pathname: "/integrating", title: "Integrating Snaps" },
      { pathname: "/examples", title: "Examples" },
    ],
  },
  {
    title: "Snap Protocol",
    pages: [
      { pathname: "/protocol", title: "Overview" },
      { pathname: "/elements", title: "Elements" },
      { pathname: "/buttons", title: "Buttons" },
      { pathname: "/effects", title: "Effects" },
      { pathname: "/theme", title: "Theme & Styling" },
      { pathname: "/colors", title: "Color Palette" },
      { pathname: "/actions", title: "Actions" },
      { pathname: "/constraints", title: "Constraints" },
      { pathname: "/auth", title: "Authentication" },
      { pathname: "/data-store", title: "Persistent State" },
    ],
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
