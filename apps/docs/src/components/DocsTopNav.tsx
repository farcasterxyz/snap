import Link from "next/link";
import { ExternalLink } from "lucide-react";
import FarcasterLogo from "./FarcasterLogo";
import Search from "./Search";

const DOCS = "https://docs.farcaster.xyz";

export default function DocsTopNav() {
  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <a className="top-nav-logo" href={`${DOCS}/`}>
          <FarcasterLogo size={18} />
          <span className="top-nav-logo-text">
            Farcaster <span className="top-nav-logo-dim">docs</span>
          </span>
        </a>
        <nav className="top-nav-links" aria-label="Documentation">
          <a className="top-nav-link" href={`${DOCS}/learn`}>
            Learn
          </a>
          <a className="top-nav-link" href={`${DOCS}/developers`}>
            Build apps
          </a>
          <a className="top-nav-link" href={`${DOCS}/auth-kit`}>
            AuthKit
          </a>
          <Link className="top-nav-link active" href="/">
            Snap
          </Link>
          <a className="top-nav-link" href={`${DOCS}/reference`}>
            Reference
          </a>
          <a
            className="top-nav-link"
            href="https://snapchain.farcaster.xyz/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Snapchain
            <ExternalLink
              size={11}
              aria-hidden
              strokeWidth={2}
              style={{ marginLeft: 3, opacity: 0.5 }}
            />
          </a>
        </nav>
      </div>
      <div className="top-nav-right">
        <Search />
        <a
          href="https://farcaster.xyz/~/channel/fc-devs"
          className="top-nav-social"
          target="_blank"
          rel="noopener noreferrer"
          title="farcaster"
          aria-label="farcaster"
        >
          <FarcasterLogo size={16} />
        </a>
        <a
          href="https://github.com/farcasterxyz/protocol"
          className="top-nav-social"
          target="_blank"
          rel="noopener noreferrer"
          title="github"
          aria-label="github"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
        <a
          href="https://x.com/farcaster_xyz"
          className="top-nav-social"
          target="_blank"
          rel="noopener noreferrer"
          title="twitter"
          aria-label="twitter"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a
          href="https://www.youtube.com/@farcasterxyz"
          className="top-nav-social"
          target="_blank"
          rel="noopener noreferrer"
          title="youtube"
          aria-label="youtube"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
