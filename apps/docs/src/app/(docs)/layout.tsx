import Link from "next/link";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="main-content" style={{ position: "relative" }}>
      <Link href="/llms.txt" className="docs-llms-link">
        llms.txt
      </Link>
      <article className="docs-content">{children}</article>
    </main>
  );
}
