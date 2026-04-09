"use client";

import Link from "next/link";
import { useVersion } from "./VersionContext";
import { DEFAULT_VERSION } from "@/lib/version-config";

/**
 * MDX link override. Internal doc links (starting with /snap/) are rendered
 * as Next.js <Link> with the current version prefix injected. External links
 * and anchor links pass through as regular <a>.
 */
export default function DocLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const version = useVersion();

  if (!href) {
    return <a {...props}>{children}</a>;
  }

  // Anchor links — pass through
  if (href.startsWith("#")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  // Internal doc links start with /snap/ (the basePath)
  if (href.startsWith("/snap/") || href === "/snap") {
    // Strip /snap prefix to get the app-internal path
    const appPath = href === "/snap" ? "/" : href.slice("/snap".length);

    // If browsing a non-default version, prefix with the version
    let versionedPath: string;
    if (version !== DEFAULT_VERSION) {
      versionedPath = appPath === "/" ? `/${version}` : `/${version}${appPath}`;
    } else {
      versionedPath = appPath;
    }

    return (
      <Link href={versionedPath} {...props}>
        {children}
      </Link>
    );
  }

  // External links — open in new tab
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  // Everything else — regular link
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
