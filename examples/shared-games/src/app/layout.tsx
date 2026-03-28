import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farcaster Shared Games",
  description: "Collaborative games in the Farcaster feed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
