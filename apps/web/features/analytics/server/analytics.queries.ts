import "server-only"

import {
  BREAKDOWN_MAX_LIMIT,
  type BreakdownBy,
  type StatsBreakdownResponse,
  statsBreakdownResponseSchema,
  type StatsOverviewResponse,
  statsOverviewResponseSchema,
  type StatsRange,
  type StatsLiveResponse,
  statsLiveResponseSchema,
  type StatsTimeseriesResponse,
  statsTimeseriesResponseSchema,
  type StatsVisitorsResponse,
  statsVisitorsResponseSchema,
  siteIdSchema,
  VISITORS_DEFAULT_LIMIT,
} from "@workspace/contracts"
import { cache } from "react"
import type * as z from "zod"

import { apiRequest } from "@/lib/api-client"

// `cache` dedupes calls within a request: the stat cards and the chart
// summary share one overview request.

async function getStats<T extends z.ZodType>(
  siteId: string,
  endpoint: "overview" | "timeseries" | "breakdown" | "live" | "visitors",
  query: Record<string, string>,
  schema: T
): Promise<z.output<T>> {
  // Checked here too, not only by the caller: it becomes part of the path.
  const id = siteIdSchema.parse(siteId)
  const path =
    `/api/v1/sites/${id}/stats/${endpoint}?${new URLSearchParams(query)}` as const
  const result = await apiRequest(path, schema)
  if (!result.ok) {
    throw new Error(
      `${path} failed (${result.error.code}): ${result.error.message}`
    )
  }
  return result.data
}

export const getOverview = cache(
  (siteId: string, range: StatsRange): Promise<StatsOverviewResponse> =>
    getStats(siteId, "overview", { range }, statsOverviewResponseSchema)
)

export const getTimeseries = cache(
  (siteId: string, range: StatsRange): Promise<StatsTimeseriesResponse> =>
    getStats(siteId, "timeseries", { range }, statsTimeseriesResponseSchema)
)

/**
 * The top rows by visitors, up to the API's maximum of 50. Cards show five
 * and "View all" shows the rest, so one request serves both, and the
 * highlights reuse it through `cache`.
 */
export const getBreakdown = cache(
  (
    siteId: string,
    range: StatsRange,
    by: BreakdownBy
  ): Promise<StatsBreakdownResponse> =>
    getStats(
      siteId,
      "breakdown",
      { range, by, limit: String(BREAKDOWN_MAX_LIMIT) },
      statsBreakdownResponseSchema
    )
)

/** Visitors on the site right now. Not cached: the live poller calls it. */
export function getLiveVisitors(siteId: string): Promise<StatsLiveResponse> {
  return getStats(siteId, "live", {}, statsLiveResponseSchema)
}

/** The most recent visitors in the range, latest first. */
export const getRecentVisitors = cache(
  (siteId: string, range: StatsRange): Promise<StatsVisitorsResponse> =>
    getStats(
      siteId,
      "visitors",
      { range, limit: String(VISITORS_DEFAULT_LIMIT) },
      statsVisitorsResponseSchema
    )
)
