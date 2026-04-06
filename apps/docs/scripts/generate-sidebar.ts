import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DOC_SECTIONS } from "../src/lib/docs-pages";

const __dirname = dirname(fileURLToPath(import.meta.url));

type SidebarLink = {
  text: string;
  link: string;
};

type SidebarGroup = {
  text: string;
  items: SidebarLink[];
};

function prefixPath(pathname: string): string {
  if (pathname === "/") return "/snap";
  return `/snap${pathname}`;
}

const sidebar: SidebarGroup[] = DOC_SECTIONS.map((section) => ({
  text: section.title,
  items: section.pages.map((page) => ({
    text: page.title,
    link: prefixPath(page.pathname),
  })),
}));

const outPath = resolve(__dirname, "../snap-sidebar.json");
writeFileSync(outPath, JSON.stringify(sidebar, null, 2) + "\n");

console.log(`Wrote ${outPath}`);
