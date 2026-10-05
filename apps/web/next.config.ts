import type { NextConfig } from "next"

import { apiOrigin } from "./lib/env"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  // The browser only talks to this origin. The API Worker answers /api/*,
  // which keeps auth cookies first-party.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin()}/api/:path*` }]
  },
}

export default nextConfig
