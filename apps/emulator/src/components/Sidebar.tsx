"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";
import FarcasterLogo from "./FarcasterLogo";
import { useTheme } from "./ThemeProvider";

type NavItem = { label: string; href: string; external?: boolean };
type NavSection = { title: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs" },
      { label: "Examples", href: "/docs/examples" },
    ],
  },
  {
    title: "Spec",
    items: [
      { label: "Elements", href: "/docs/elements" },
      { label: "Buttons", href: "/docs/buttons" },
      { label: "Effects", href: "/docs/effects" },
      { label: "Constraints", href: "/docs/constraints" },
    ],
  },
  {
    title: "Styling",
    items: [
      { label: "Theme", href: "/docs/theme" },
      { label: "Colors", href: "/docs/colors" },
    ],
  },
  {
    title: "Guides",
    items: [
      { label: "Building a Snap", href: "/docs/building" },
      { label: "Authentication", href: "/docs/auth" },
    ],
  },
  {
    title: "Tools",
    items: [{ label: "Emulator", href: "https://farcaster.xyz/~/developers/snaps", external: true }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar-header">
        <Link
          href="/docs"
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
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="sidebar-nav">
            {NAV.map((section) => (
              <div key={section.title} className="sidebar-section">
                <div className="sidebar-section-title">{section.title}</div>
                {section.items.map((item) =>
                  item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sidebar-link"
                    >
                      {item.label}
                      <ExternalLink size={12} style={{ marginLeft: 4, opacity: 0.5 }} />
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link${pathname === item.href ? " active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <button
              className="sidebar-icon-btn"
              onClick={toggle}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
