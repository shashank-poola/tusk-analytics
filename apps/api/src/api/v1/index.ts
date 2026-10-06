import { Hono } from "hono"

import type { AppEnv } from "../../config/env"
import { ingestRoutes } from "./ingest/ingest.routes"
import { sitesRoutes } from "./sites/sites.routes"
import { statsRoutes } from "./stats/stats.routes"

export const v1 = new Hono<AppEnv>()

v1.route("/collect", ingestRoutes)
// Before /sites: sitesRoutes' requireUser matches /sites/* too, and stats
// answers first so the session is read once.
v1.route("/sites/:siteId/stats", statsRoutes)
v1.route("/sites", sitesRoutes)
