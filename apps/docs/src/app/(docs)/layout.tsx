import Link from "next/link";
import { VersionProvider } from "@/components/VersionContext";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VersionProvider>
      <main className="main-content" style={{ position: "relative" }}>
        <Link href="/llms.txt" className="docs-llms-link">
          llms.txt
        </Link>
        <article className="docs-content">{children}</article>
      </main>
    </VersionProvider>
  );
}
