import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build live next to a running dev server (which owns
  // ".next"): NEXT_DIST_DIR=.next-prod pnpm build && NEXT_DIST_DIR=.next-prod pnpm start
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // @remotion/renderer bundles a headless-browser/FFmpeg dependency graph
  // that must not be re-bundled by Next.js itself when used from an API
  // route. See: https://www.remotion.dev/docs/miscellaneous/nextjs
  serverExternalPackages: ["@remotion/renderer"],
  // Strict Mode makes React render every component twice in development to
  // surface bugs. This editor re-renders its 3D scene for every video
  // frame, so that doubling costs half the frame budget while previewing
  // (it never applied to production builds or to server renders).
  reactStrictMode: false,
};

export default nextConfig;
