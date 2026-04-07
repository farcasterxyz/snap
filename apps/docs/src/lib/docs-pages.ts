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
  Home: "(home)",
  Learn: "(learn)",
  Spec: "(spec)",
};

// NOTE: keep this in sync with snap-sidebar.json and apps/docs/src/app/(docs)/(home)/page.mdx
export const DOC_SECTIONS: DocSection[] = [
  {
    title: "Home",
    untitled: true,
    pages: [
      { pathname: "/", title: "Introduction" },
      { pathname: "/agents", title: "Building Snaps with AI" },
    ],
  },
  {
    title: "Learn",
    pages: [
      { pathname: "/building", title: "Building a Snap" },
      { pathname: "/integrating", title: "Integrating Snaps" },
      { pathname: "/persistent-state", title: "Persistent State" },
      { pathname: "/examples", title: "Examples" },
    ],
  },
  {
    title: "Spec",
    pages: [
      { pathname: "/spec-overview", title: "Overview" },
      { pathname: "/http-headers", title: "HTTP Headers" },
      { pathname: "/elements", title: "Elements" },
      { pathname: "/buttons", title: "Buttons" },
      { pathname: "/effects", title: "Effects" },
      { pathname: "/theme", title: "Theme & Styling" },
      { pathname: "/colors", title: "Color Palette" },
      { pathname: "/actions", title: "Actions" },
      { pathname: "/constraints", title: "Constraints" },
      { pathname: "/auth", title: "Authentication" },
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
