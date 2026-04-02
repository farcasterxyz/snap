"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Sun, Moon } from "lucide-react";
import FarcasterLogo from "./FarcasterLogo";
import { DOC_SECTIONS } from "@/lib/docs-pages";

type NavItem = { label: string; href: string; external?: boolean };
type NavSection = { title: string; items: NavItem[] };

const NAV: NavSection[] = DOC_SECTIONS.map((section) => ({
  title: section.title,
  items: section.pages.map((page) => ({
    label: page.title,
    href: page.pathname,
  })),
})).filter((section) => section.items.length > 0);

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("docs-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function Sidebar() {
  const pathname = usePathname();
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
      <div className="sidebar-header">
        <Link
          href="/"
          style={{ textDecoration: "none", color: "inherit" }}
          className="sidebar-logo"
        >
          <FarcasterLogo size={18} />
          {!collapsed && (
            <span className="sidebar-logo-text">
              Snap <span className="sidebar-logo-dim">docs</span>
            </span>
          )}
        </Link>
        <button
          className="sidebar-icon-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="sidebar-nav">
            {NAV.map((section) => (
              <div key={section.title} className="sidebar-section">
                <div className="sidebar-section-title">{section.title}</div>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link${
                      pathname === item.href ? " active" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
              } mode`}
            >
              {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
