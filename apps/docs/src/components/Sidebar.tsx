"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Sun, Moon } from "lucide-react";
import VersionDropdown, { parseVersionFromPathname } from "./VersionDropdown";
import { VERSION_DOC_SECTIONS } from "@/lib/docs-pages";
import { DEFAULT_VERSION } from "@/lib/version-config";

type NavItem = { label: string; href: string };
type NavSection = { title: string; untitled?: boolean; items: NavItem[] };

function buildNav(version: string): NavSection[] {
  const sections =
    VERSION_DOC_SECTIONS[version] ?? VERSION_DOC_SECTIONS[DEFAULT_VERSION]!;
  const prefix = version === DEFAULT_VERSION ? "" : `/${version}`;

  return sections
    .map((section) => ({
      title: section.title,
      untitled: section.untitled,
      items: section.pages.map((page) => ({
        label: page.title,
        href:
          page.pathname === "/"
            ? prefix || "/"
            : `${prefix}${page.pathname}`,
      })),
    }))
    .filter((section) => section.items.length > 0);
}

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("docs-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Sidebar() {
  const pathname = usePathname();
  const { version } = parseVersionFromPathname(pathname);
  const nav = buildNav(version);

  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("docs-theme", next);
      return next;
    });
  }, []);

  return (
    <nav className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      {!collapsed && (
        <>
          <div className="sidebar-version">
            <VersionDropdown />
          </div>

          <div className="sidebar-nav">
            {nav.map((section) => (
              <div key={section.title} className="sidebar-section">
                {!section.untitled && (
                  <div className="sidebar-section-title">{section.title}</div>
                )}
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link${section.untitled ? " sidebar-link--top" : ""}${
                      pathname === item.href ? " active" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {collapsed && <div className="sidebar-spacer" aria-hidden />}

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-icon-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
        {!collapsed && (
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        )}
      </div>
    </nav>
  );
}
