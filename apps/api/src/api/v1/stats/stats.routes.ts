import type {
  StatsBreakdownResponse,
  StatsOverviewResponse,
  StatsTimeseriesResponse,
} from "@workspace/contracts"
import { createDb } from "@workspace/db"
import { Hono } from "hono"

import type { SiteEnv } from "../../../config/env"
import { queryParams } from "../../../lib/validate"
import { requireSite } from "../../../middleware/require-site"
import { requireUser } from "../../../middleware/require-user"
import { breakdownQuerySchema, statsQuerySchema } from "./stats.schema"
import {
  getStatsBreakdown,
  getStatsOverview,
  getStatsTimeseries,
} from "./stats.service"

/**
 * Mounted at /sites/:siteId/stats. requireSite answers 404 unless the
 * signed-in user owns :siteId.
 */
export const statsRoutes = new Hono<SiteEnv>()
  .use(requireUser)
  .use(requireSite)
  .get("/overview", queryParams(statsQuerySchema), async (c) => {
    const overview = await getStatsOverview(
      createDb(c.env.DB),
      c.get("site"),
      c.req.valid("query").range,
      new Date()
    )
    return c.json(overview satisfies StatsOverviewResponse)
  })
  .get("/timeseries", queryParams(statsQuerySchema), async (c) => {
    const timeseries = await getStatsTimeseries(
      createDb(c.env.DB),
      c.get("site"),
      c.req.valid("query").range,
      new Date()
    )
    return c.json(timeseries satisfies StatsTimeseriesResponse)
  })
  .get("/breakdown", queryParams(breakdownQuerySchema), async (c) => {
    const breakdown = await getStatsBreakdown(
      createDb(c.env.DB),
      c.get("site"),
      c.req.valid("query"),
      new Date()
    )
    return c.json(breakdown satisfies StatsBreakdownResponse)
  })
