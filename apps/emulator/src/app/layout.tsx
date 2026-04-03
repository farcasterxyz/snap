import type { Metadata } from "next";
import { ColorModeInitializer } from "@neynar/ui/color-mode";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farcaster Snap Emulator",
  description: "Emulator for Farcaster Snaps",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorModeInitializer />
      </head>
      <body>{children}</body>
    </html>
  );
}
