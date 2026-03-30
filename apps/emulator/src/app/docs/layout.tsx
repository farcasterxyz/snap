export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="main-content" style={{ position: "relative" }}>
      <a href="/llms.txt" className="docs-llms-link">
        llms.txt
      </a>
      <article className="docs-content">{children}</article>
    </main>
  );
}
