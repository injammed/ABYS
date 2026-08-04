/** @type {import('next').NextConfig} */
const onGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "export",
  trailingSlash: true,
  basePath: onGitHubPages ? "/ABYS" : "",
  assetPrefix: onGitHubPages ? "/ABYS" : "",
  images: { unoptimized: true },
};

export default nextConfig;
