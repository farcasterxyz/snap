"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ColorModeToggle, useColorMode } from "@neynar/ui/color-mode";
import { PanelLeftClose, PanelLeftOpen, ExternalLink } from "lucide-react";
import FarcasterLogo from "./FarcasterLogo";

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
      { label: "Existing Website", href: "/docs/existing-site" },
      { label: "Authentication", href: "/docs/auth" },
    ],
  },
  {
    title: "Tools",
    items: [
      {
        label: "Emulator",
        href: "https://farcaster.xyz/~/developers/snaps",
        external: true,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { setPreference } = useColorMode();
  const [collapsed, setCollapsed] = useState(false);
  const didMigrateLegacyTheme = useRef(false);

  useEffect(() => {
    if (didMigrateLegacyTheme.current || typeof document === "undefined") {
      return;
    }
    didMigrateLegacyTheme.current = true;
    if (document.cookie.includes("color-mode=")) {
      localStorage.removeItem("docs-theme");
      return;
    }
    const legacy = localStorage.getItem("docs-theme");
    if (legacy === "light" || legacy === "dark") {
      setPreference(legacy);
      localStorage.removeItem("docs-theme");
    }
  }, [setPreference]);

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
                      <ExternalLink
                        size={12}
                        style={{ marginLeft: 4, opacity: 0.5 }}
                      />
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link${
                        pathname === item.href ? " active" : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <ColorModeToggle
              variant="ghost"
              size="sm"
              align="end"
              className="h-7 w-7 p-0 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              title="Theme: system, light, or dark"
            />
          </div>
        </>
      )}
    </nav>
  );
}
