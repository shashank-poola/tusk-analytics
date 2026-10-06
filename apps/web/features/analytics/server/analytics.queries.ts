import "server-only"

import {
  BREAKDOWN_MAX_LIMIT,
  type BreakdownBy,
  type StatsBreakdownResponse,
  statsBreakdownResponseSchema,
  type StatsInterval,
  type StatsLiveResponse,
  statsLiveResponseSchema,
  type StatsOverviewResponse,
  statsOverviewResponseSchema,
  type StatsPeriod,
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

import { periodQuery } from "@/features/analytics/utils/analytics-params"

// `cache` dedupes calls within a request (the stat cards and the chart
// summary share one overview request). It compares arguments by identity,
// so the cached functions take the query as a string.

type Endpoint = "overview" | "timeseries" | "breakdown" | "live" | "visitors"

async function getStats<T extends z.ZodType>(
  siteId: string,
  endpoint: Endpoint,
  query: string,
  schema: T
): Promise<z.output<T>> {
  // Checked here too, not only by the caller: it becomes part of the path.
  const id = siteIdSchema.parse(siteId)
  const path = `/api/v1/sites/${id}/stats/${endpoint}?${query}` as const
  const result = await apiRequest(path, schema)
  if (!result.ok) {
    throw new Error(
      `${path} failed (${result.error.code}): ${result.error.message}`
    )
  }
  return result.data
}

function toQuery(period: StatsPeriod, extra: Record<string, string> = {}) {
  return new URLSearchParams({ ...periodQuery(period), ...extra }).toString()
}

const overview = cache((siteId: string, query: string) =>
  getStats(siteId, "overview", query, statsOverviewResponseSchema)
)

export function getOverview(
  siteId: string,
  period: StatsPeriod
): Promise<StatsOverviewResponse> {
  return overview(siteId, toQuery(period))
}

const timeseries = cache((siteId: string, query: string) =>
  getStats(siteId, "timeseries", query, statsTimeseriesResponseSchema)
)

export function getTimeseries(
  siteId: string,
  period: StatsPeriod,
  interval: StatsInterval
): Promise<StatsTimeseriesResponse> {
  return timeseries(siteId, toQuery(period, { interval }))
}

const breakdown = cache((siteId: string, query: string) =>
  getStats(siteId, "breakdown", query, statsBreakdownResponseSchema)
)

/**
 * The top rows by visitors, up to the API's maximum of 50. Cards show the
 * first ten and "Details" shows the rest, so one request serves both, and
 * the highlights reuse it through `cache`.
 */
export function getBreakdown(
  siteId: string,
  period: StatsPeriod,
  by: BreakdownBy
): Promise<StatsBreakdownResponse> {
  return breakdown(
    siteId,
    toQuery(period, { by, limit: String(BREAKDOWN_MAX_LIMIT) })
  )
}

/** Visitors on the site right now. Not cached: the live poller calls it. */
export function getLiveVisitors(siteId: string): Promise<StatsLiveResponse> {
  return getStats(siteId, "live", "", statsLiveResponseSchema)
}

const recentVisitors = cache((siteId: string, query: string) =>
  getStats(siteId, "visitors", query, statsVisitorsResponseSchema)
)

/** The most recent visitors in the period, latest first. */
export function getRecentVisitors(
  siteId: string,
  period: StatsPeriod
): Promise<StatsVisitorsResponse> {
  return recentVisitors(
    siteId,
    toQuery(period, { limit: String(VISITORS_DEFAULT_LIMIT) })
  )
}
