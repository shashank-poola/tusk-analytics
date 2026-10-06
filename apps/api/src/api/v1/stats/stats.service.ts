import {
  type BreakdownBy,
  LIVE_WINDOW_MINUTES,
  type StatsBreakdownResponse,
  type StatsLiveResponse,
  bucketStarts,
  type StatsInterval,
  type StatsOverviewResponse,
  type StatsPeriod,
  type StatsTimeseriesResponse,
  type StatsTotals,
  type StatsVisitorsResponse,
} from "@workspace/contracts"
import {
  type Database,
  getBreakdown,
  getLiveVisitors,
  getRecentVisitors,
  getTimeseries,
  getTotals,
  type Site,
  type StatsTotalsRow,
} from "@workspace/db"

import { chartInterval, siteWindow, toOffsetIso } from "./stats.range"
import { createVisitorPseudonymizer } from "./visitor-pseudonym"

// Metric definitions: docs/metrics.md. Every function takes `now` so tests
// can pin the range, and a site the caller has already checked ownership of.

type StatsSite = Pick<Site, "id" | "timezone">

function toTotals({
  bounces,
  sessionDurationMs,
  ...row
}: StatsTotalsRow): StatsTotals {
  if (row.sessions === 0) return { ...row, bounceRate: 0, avgSessionSeconds: 0 }
  return {
    ...row,
    bounceRate: bounces / row.sessions,
    avgSessionSeconds: sessionDurationMs / row.sessions / 1000,
  }
}

const toIso = (ms: number) => new Date(ms).toISOString()

export async function getStatsOverview(
  db: Database,
  site: StatsSite,
  period: StatsPeriod,
  now: Date
): Promise<StatsOverviewResponse> {
  const window = siteWindow(period, site.timezone, now)
  const [current, previous] = await Promise.all([
    getTotals(db, site.id, window.fromMs, window.toMs),
    getTotals(db, site.id, window.previousFromMs, window.previousToMs),
  ])
  return {
    range: {
      from: toIso(window.fromMs),
      to: toIso(window.toMs),
      previousFrom: toIso(window.previousFromMs),
      previousTo: toIso(window.previousToMs),
    },
    current: toTotals(current),
    previous: toTotals(previous),
  }
}

/**
 * One point per bucket of `interval` (the period's default when missing),
 * zero-filled. A 400 when hourly buckets would be too many.
 */
export async function getStatsTimeseries(
  db: Database,
  site: StatsSite,
  {
    interval: requested,
    ...period
  }: StatsPeriod & { interval?: StatsInterval | undefined },
  now: Date
): Promise<StatsTimeseriesResponse> {
  const interval = chartInterval(period, requested)
  const window = siteWindow(period, site.timezone, now)
  const rows = await getTimeseries(db, site.id, window.fromMs, window.toMs, {
    interval,
    offsetMs: window.offsetMs,
  })
  const byBucket = new Map(rows.map((row) => [row.bucket, row]))
  const points = bucketStarts(window, interval).map((start) => {
    const row = byBucket.get(start + window.offsetMs)
    return {
      t: toOffsetIso(start, window.offsetMs),
      visitors: row?.visitors ?? 0,
      pageviews: row?.pageviews ?? 0,
    }
  })
  return { interval, points, inProgress: window.toMs === now.getTime() }
}

export async function getStatsBreakdown(
  db: Database,
  site: StatsSite,
  { by, limit, ...period }: StatsPeriod & { by: BreakdownBy; limit: number },
  now: Date
): Promise<StatsBreakdownResponse> {
  const window = siteWindow(period, site.timezone, now)
  const rows = await getBreakdown(db, site.id, window.fromMs, window.toMs, {
    dimension: by,
    limit,
  })
  return { by, rows }
}

/** Distinct visitors in the last LIVE_WINDOW_MINUTES, up to `now`. */
export async function getStatsLive(
  db: Database,
  site: StatsSite,
  now: Date
): Promise<StatsLiveResponse> {
  const toMs = now.getTime()
  const fromMs = toMs - LIVE_WINDOW_MINUTES * 60_000
  return { visitors: await getLiveVisitors(db, site.id, fromMs, toMs) }
}

/**
 * Recent visitors in the range. `secret` keys the pseudonym that replaces
 * the tracker's visitor id (see visitor-pseudonym.ts).
 */
export async function getStatsVisitors(
  db: Database,
  site: StatsSite,
  { limit, secret, ...period }: StatsPeriod & { limit: number; secret: string },
  now: Date
): Promise<StatsVisitorsResponse> {
  const window = siteWindow(period, site.timezone, now)
  const [rows, pseudonymOf] = await Promise.all([
    getRecentVisitors(db, site.id, window.fromMs, window.toMs, { limit }),
    createVisitorPseudonymizer(secret, site.id),
  ])
  const visitors = await Promise.all(
    rows.map(async ({ visitorId, firstSeenAt, lastSeenAt, ...row }) => ({
      ...row,
      id: await pseudonymOf(visitorId),
      firstSeenAt: toIso(firstSeenAt),
      lastSeenAt: toIso(lastSeenAt),
    }))
  )
  return { visitors }
}
