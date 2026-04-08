import { DEFAULT_VERSION } from "./version-config";

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

/** Route group folder under the version directory for each sidebar section. */
const SECTION_APP_FOLDER: Record<string, string> = {
  Home: "(home)",
  Learn: "(learn)",
  Spec: "(spec)",
};

// NOTE: keep this in sync with snap-sidebar.json and the home page of each version
const SHARED_SECTIONS: DocSection[] = [
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

const V2_SECTIONS: DocSection[] = [
  SHARED_SECTIONS[0],
  {
    ...SHARED_SECTIONS[1],
    pages: [
      ...SHARED_SECTIONS[1].pages,
      { pathname: "/upgrading", title: "Upgrading from v1.0" },
    ],
  },
  SHARED_SECTIONS[2],
];

/** Per-version section definitions. Versions can override pages if needed. */
export const VERSION_DOC_SECTIONS: Record<string, DocSection[]> = {
  "1.0": SHARED_SECTIONS,
  "2.0": V2_SECTIONS,
};

/** Sections for the default version (backward compat). */
export const DOC_SECTIONS = VERSION_DOC_SECTIONS[DEFAULT_VERSION]!;

export function getDocSectionsForVersion(version: string): DocSection[] {
  return VERSION_DOC_SECTIONS[version] ?? DOC_SECTIONS;
}

export function normalizeDocPathname(pathname: string): string {
  if (pathname === "") {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

/** Relative path under `src/app/(docs)/` for the page's MDX source, including version prefix. */
export function docPathnameToMdxFile(
  pathname: string,
  version: string = DEFAULT_VERSION,
): string {
  const normalized = normalizeDocPathname(pathname);
  const sections = getDocSectionsForVersion(version);

  for (const section of sections) {
    const folder = SECTION_APP_FOLDER[section.title];
    if (!folder) {
      throw new Error(`No app folder mapped for section: ${section.title}`);
    }
    for (const page of section.pages) {
      if (normalizeDocPathname(page.pathname) !== normalized) {
        continue;
      }
      if (normalized === "/") {
        return `${version}/${folder}/page.mdx`;
      }
      return `${version}/${folder}/${page.pathname.slice(1)}/page.mdx`;
    }
  }

  throw new Error(`Unknown doc pathname: ${pathname} (version ${version})`);
}

export function getDocPageByPathname(
  pathname: string,
  version: string = DEFAULT_VERSION,
): DocPage | null {
  const normalizedPathname = normalizeDocPathname(pathname);
  const sections = getDocSectionsForVersion(version);

  for (const section of sections) {
    const page = section.pages.find((p) => p.pathname === normalizedPathname);
    if (page) {
      return page;
    }
  }

  return null;
}

export function isDocPathname(
  pathname: string,
  version: string = DEFAULT_VERSION,
): boolean {
  return getDocPageByPathname(pathname, version) !== null;
}
