import type { NextConfig } from "next";
import path from "path";

// The demo runs two `next dev` processes side by side (one per fake-login
// port, see lib/demo-user.ts) — Next's dev server lockfile lives at
// <distDir>/lock, so both processes need distinct dist dirs or the second
// one refuses to start ("Another next dev server is already running").
const distDir = process.env.PORT && process.env.PORT !== "3000"
  ? `.next-${process.env.PORT}`
  : ".next";

const nextConfig: NextConfig = {
  distDir,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
