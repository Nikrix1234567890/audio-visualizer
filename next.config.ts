import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @remotion/renderer bundles a headless-browser/FFmpeg dependency graph
  // that must not be re-bundled by Next.js itself when used from an API
  // route. See: https://www.remotion.dev/docs/miscellaneous/nextjs
  serverExternalPackages: ["@remotion/renderer"],
};

export default nextConfig;
