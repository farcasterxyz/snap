import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // Route reads SKILL.md via fs; ensure it is copied into the Vercel serverless trace.
  outputFileTracingIncludes: {
    "/SKILL.md": ["./src/app/SKILL.md/SKILL.md"],
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
});

export default withMDX(nextConfig);
