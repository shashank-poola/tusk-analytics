import type {
  StatsBreakdownResponse,
  StatsLiveResponse,
  StatsOverviewResponse,
  StatsTimeseriesResponse,
  StatsVisitorsResponse,
} from "@workspace/contracts"
import { createDb } from "@workspace/db"
import { Hono } from "hono"

import type { SiteEnv } from "../../../config/env"
import { queryParams } from "../../../lib/validate"
import { requireSite } from "../../../middleware/require-site"
import { requireUser } from "../../../middleware/require-user"
import {
  breakdownQuerySchema,
  statsQuerySchema,
  timeseriesQuerySchema,
  visitorsQuerySchema,
} from "./stats.schema"
import {
  getStatsBreakdown,
  getStatsLive,
  getStatsOverview,
  getStatsTimeseries,
  getStatsVisitors,
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
      c.req.valid("query"),
      new Date()
    )
    return c.json(overview satisfies StatsOverviewResponse)
  })
  .get("/timeseries", queryParams(timeseriesQuerySchema), async (c) => {
    const timeseries = await getStatsTimeseries(
      createDb(c.env.DB),
      c.get("site"),
      c.req.valid("query"),
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
  .get("/live", async (c) => {
    const live = await getStatsLive(
      createDb(c.env.DB),
      c.get("site"),
      new Date()
    )
    return c.json(live satisfies StatsLiveResponse)
  })
  .get("/visitors", queryParams(visitorsQuerySchema), async (c) => {
    const visitors = await getStatsVisitors(
      createDb(c.env.DB),
      c.get("site"),
      { ...c.req.valid("query"), secret: c.env.BETTER_AUTH_SECRET },
      new Date()
    )
    return c.json(visitors satisfies StatsVisitorsResponse)
  })
