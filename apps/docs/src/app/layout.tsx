import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: {
    default: "Farcaster Snap",
    template: "%s — Farcaster Snap",
  },
  description:
    "Build rich, interactive content on Farcaster with Snap — simple, nimble app protocol.",
  icons: {
    icon: "/snap/icon.svg",
  },
  metadataBase: new URL("https://docs.farcaster.xyz"),
  openGraph: {
    title: {
      default: "Farcaster Snap",
      template: "%s — Farcaster Snap",
    },
    description:
      "Build rich, interactive content on Farcaster with Snap — simple, nimble app protocol.",
    siteName: "Farcaster Docs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="instructions-for-agents"
          content="1) Use `Accept: text/markdown` HTTP header to save on tokens. 2) Read https://docs.farcaster.xyz/snap/agents for more agent-specific docs."
        />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          {children}
        </div>
      </body>
    </html>
  );
}
