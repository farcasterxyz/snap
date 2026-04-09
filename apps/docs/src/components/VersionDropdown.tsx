"use client";

import { usePathname, useRouter } from "next/navigation";
import { VERSIONS, DEFAULT_VERSION } from "@/lib/version-config";

/**
 * Extract version and page slug from the current pathname.
 * usePathname() returns the user-facing URL (without basePath).
 * - /building         → { version: DEFAULT_VERSION, slug: "/building" }
 * - /2.0/building     → { version: "2.0",           slug: "/building" }
 */
export function parseVersionFromPathname(pathname: string): {
  version: string;
  slug: string;
} {
  const match = pathname.match(/^\/([\d]+\.[\d]+)(\/.*)?$/);
  if (match) {
    return {
      version: match[1],
      slug: match[2] || "/",
    };
  }
  return { version: DEFAULT_VERSION, slug: pathname || "/" };
}

export default function VersionDropdown() {
  const pathname = usePathname();
  const router = useRouter();
  const { version: currentVersion, slug } = parseVersionFromPathname(pathname);

  function handleChange(newVersion: string) {
    if (newVersion === DEFAULT_VERSION) {
      // Use clean URL for default version
      router.push(slug === "/" ? "/" : slug);
    } else {
      router.push(`/${newVersion}${slug === "/" ? "" : slug}`);
    }
  }

  return (
    <select
      className="version-dropdown"
      value={currentVersion}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Spec version"
    >
      {VERSIONS.map((v) => (
        <option key={v.id} value={v.id}>
          {v.label}
          {v.preRelease ? " (preview)" : ""}
        </option>
      ))}
    </select>
  );
}
