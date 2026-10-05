import { createDb, getSiteForOwner } from "@workspace/db"
import { createMiddleware } from "hono/factory"

import type { SiteEnv } from "../config/env"
import { AppError } from "../lib/errors"

/**
 * Puts the `:siteId` site on the context if the signed-in user owns it.
 * Must run after `requireUser`.
 *
 * Answers 404 (never 403) for sites owned by someone else, so site ids can't
 * be probed.
 */
export const requireSite = createMiddleware<SiteEnv>(async (c, next) => {
  const siteId = c.req.param("siteId")
  if (!siteId) {
    throw new Error("requireSite is mounted on a route without :siteId")
  }

  const site = await getSiteForOwner(createDb(c.env.DB), {
    siteId,
    ownerId: c.get("user").id,
  })
  if (!site) throw new AppError("not_found", "Site not found")

  c.set("site", site)
  await next()
})
