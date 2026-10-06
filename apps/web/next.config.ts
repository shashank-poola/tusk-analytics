import type { NextConfig } from "next"
import { PHASE_PRODUCTION_SERVER } from "next/constants"

import { apiOrigin, scriptUrl } from "./lib/env"

export default function nextConfig(phase: string): NextConfig {
  // Fail `next start` on a missing script URL instead of breaking the first
  // install page. Builds and `next typegen` don't need it.
  if (phase === PHASE_PRODUCTION_SERVER) scriptUrl()

  return {
    transpilePackages: ["@workspace/contracts", "@workspace/ui"],
    // The browser only talks to this origin. The API Worker answers /api/*,
    // which keeps auth cookies first-party.
    // One site's dashboard moved from /sites/<id> to /site/<id>; /sites is
    // now the list of all of them.
    async redirects() {
      return [
        {
          source: "/sites/:siteId(vt_[0-9a-z]{16})",
          destination: "/site/:siteId",
          permanent: false,
        },
      ]
    },
    async rewrites() {
      return [
        { source: "/api/:path*", destination: `${apiOrigin()}/api/:path*` },
      ]
    },
  }
}
