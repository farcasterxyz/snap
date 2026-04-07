import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  assetPrefix: "https://snap-docs.farcaster.xyz",
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
});

export default withMDX(nextConfig);
