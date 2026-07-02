import type { NextConfig } from "next";
import path from "path";

// Dev-only: the demo runs two `next dev` processes side by side (one per
// fake-login port, see lib/demo-user.ts) — Next's dev server lockfile lives
// at <distDir>/lock, so both processes need distinct dist dirs or the
// second one refuses to start ("Another next dev server is already
// running"). Gated to NODE_ENV === "development" (which `next dev` sets
// automatically) so a production `next start` — where the host platform may
// also set PORT — always uses the plain ".next" the build actually wrote to.
const isDev = process.env.NODE_ENV === "development";
const distDir = isDev && process.env.PORT && process.env.PORT !== "3000"
  ? `.next-${process.env.PORT}`
  : ".next";

const nextConfig: NextConfig = {
  distDir,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
