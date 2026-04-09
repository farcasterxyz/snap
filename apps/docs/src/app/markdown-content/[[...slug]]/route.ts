import { getDocMarkdownByPathname } from "@/lib/docs-markdown";
import { DEFAULT_VERSION, isValidVersion } from "@/lib/version-config";

type RouteContext = {
  params: Promise<{
    slug?: string[];
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const pathname = slug?.length ? `/${slug.join("/")}` : "/";
  const url = new URL(request.url);
  const versionParam = url.searchParams.get("version") ?? DEFAULT_VERSION;
  const version = isValidVersion(versionParam) ? versionParam : DEFAULT_VERSION;
  const content = getDocMarkdownByPathname(pathname, version);

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
