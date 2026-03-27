import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snap Emulator",
  description: "Interactive emulator for Farcaster snaps",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
