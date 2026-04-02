import { getDocMarkdownByPathname } from "@/lib/docs-markdown";

type RouteContext = {
  params: Promise<{
    slug?: string[];
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const pathname = slug?.length ? `/${slug.join("/")}` : "/";
  const content = getDocMarkdownByPathname(pathname);

  if (!content) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
