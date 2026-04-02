export type DocPage = {
  pathname: string;
  file: string;
  title: string;
};

export const DOC_PAGES: DocPage[] = [
  { pathname: "/", file: "page.mdx", title: "Introduction" },
  { pathname: "/examples", file: "examples/page.mdx", title: "Examples" },
  { pathname: "/elements", file: "elements/page.mdx", title: "Elements" },
  { pathname: "/buttons", file: "buttons/page.mdx", title: "Buttons" },
  { pathname: "/effects", file: "effects/page.mdx", title: "Effects" },
  {
    pathname: "/constraints",
    file: "constraints/page.mdx",
    title: "Constraints",
  },
  { pathname: "/theme", file: "theme/page.mdx", title: "Theme & Styling" },
  { pathname: "/colors", file: "colors/page.mdx", title: "Color Palette" },
  {
    pathname: "/building",
    file: "building/page.mdx",
    title: "Building a Snap",
  },
  {
    pathname: "/existing-site",
    file: "existing-site/page.mdx",
    title: "Adding a Snap to an Existing Website",
  },
  { pathname: "/auth", file: "auth/page.mdx", title: "Authentication" },
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

export function getDocPageByPathname(pathname: string): DocPage | null {
  const normalizedPathname = normalizeDocPathname(pathname);

  return DOC_PAGES.find((page) => page.pathname === normalizedPathname) ?? null;
}

export function isDocPathname(pathname: string): boolean {
  return getDocPageByPathname(pathname) !== null;
}
