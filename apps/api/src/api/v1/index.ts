import { Hono } from "hono"

import type { AppEnv } from "../../config/env"
import { sitesRoutes } from "./sites/sites.routes"

export const v1 = new Hono<AppEnv>()

v1.route("/sites", sitesRoutes)
