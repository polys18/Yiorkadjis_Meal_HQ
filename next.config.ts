import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow a separate build/dev directory (e.g. for parallel e2e dev server).
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
