import path from "node:path";
import type { NextConfig } from "next";

// The Content pages read the Arabic curriculum straight from the mobile app's
// data files (apps/mobile/src/data), so there is one copy of the lessons, not
// two. That means the bundler has to be allowed to resolve files outside
// apps/admin — the root is widened to apps/ for that.
const appsRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  turbopack: { root: appsRoot },
  outputFileTracingRoot: appsRoot,
};

export default nextConfig;
