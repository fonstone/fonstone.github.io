import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repoInfo = process.env.GITHUB_REPOSITORY?.split("/") ?? [];
const repoOwner = repoInfo[0]?.toLowerCase();
const repoName = repoInfo[1]?.toLowerCase();
const isUserOrOrgPage =
  Boolean(repoOwner && repoName) && repoName === `${repoOwner}.github.io`;
const basePath =
  isGitHubPages && repoName && !isUserOrOrgPage ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
