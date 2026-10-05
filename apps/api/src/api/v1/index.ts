import { Hono } from "hono"

import type { AppEnv } from "../../config/env"
import { requireSite } from "../../middleware/require-site"
import { requireUser } from "../../middleware/require-user"

export const v1 = new Hono<AppEnv>()

// TEMPORARY: only here to prove the requireUser → requireSite chain works.
// Replace it with the sites module (api/v1/sites/) when that is built.
v1.get("/sites/:siteId", requireUser, requireSite, (c) =>
  c.json({ site: c.get("site") })
)
