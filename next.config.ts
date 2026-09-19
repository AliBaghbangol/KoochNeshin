import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Turbopack build OOM-kills in ~2GB sandboxes — eslint already runs
  // separately via `bun run lint`, so keep the build lean.
  eslint: { ignoreDuringBuilds: true },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // The sandbox preview proxies requests from *.space-z.ai hosts; without this
  // allow-list Next logs a cross-origin warning for /_next/* resources.
  // Local loopback origins are included so direct 127.0.0.1/localhost access
  // (preview iframe, agent-browser QA) can never be blocked either.
  allowedDevOrigins: ["*.space-z.ai", "127.0.0.1", "localhost"],
};

export default nextConfig;
