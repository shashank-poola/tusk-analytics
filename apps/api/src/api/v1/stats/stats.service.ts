import {
  type BreakdownBy,
  LIVE_WINDOW_MINUTES,
  type StatsBreakdownResponse,
  type StatsLiveResponse,
  bucketStarts,
  type StatsInterval,
  type StatsOverviewResponse,
  type StatsFilters,
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
  getTopSourceByBucket,
  getTotals,
  type Site,
  type StatsTotalsRow,
} from "@workspace/db"

import {
  chartInterval,
  filtersOf,
  siteWindow,
  toOffsetIso,
} from "./stats.range"
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
  query: StatsPeriod & StatsFilters,
  now: Date
): Promise<StatsOverviewResponse> {
  const window = siteWindow(query, site.timezone, now)
  const filters = filtersOf(query)
  const [current, previous] = await Promise.all([
    getTotals(db, site.id, window.fromMs, window.toMs, filters),
    getTotals(db, site.id, window.previousFromMs, window.previousToMs, filters),
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
 * zero-filled, each with its top source, plus the full period before it,
 * bucket by bucket. A 400 when hourly buckets would be too many.
 */
export async function getStatsTimeseries(
  db: Database,
  site: StatsSite,
  {
    interval: requested,
    ...period
  }: StatsPeriod & StatsFilters & { interval?: StatsInterval | undefined },
  now: Date
): Promise<StatsTimeseriesResponse> {
  const interval = chartInterval(period, requested)
  const window = siteWindow(period, site.timezone, now)
  const { offsetMs } = window
  const span = window.endMs - window.fromMs
  const previous = {
    fromMs: window.fromMs - span,
    endMs: window.fromMs,
    offsetMs,
  }
  const options = { interval, offsetMs, filters: filtersOf(period) }
  const [rows, previousRows, topSources] = await Promise.all([
    getTimeseries(db, site.id, window.fromMs, window.toMs, options),
    getTimeseries(db, site.id, previous.fromMs, previous.endMs, options),
    getTopSourceByBucket(db, site.id, window.fromMs, window.toMs, options),
  ])

  const toPoints = (bucketStartsMs: number[], found: typeof rows) => {
    const byBucket = new Map(found.map((row) => [row.bucket, row]))
    return bucketStartsMs.map((start) => {
      const row = byBucket.get(start + offsetMs)
      return {
        t: toOffsetIso(start, offsetMs),
        visitors: row?.visitors ?? 0,
        pageviews: row?.pageviews ?? 0,
      }
    })
  }
  const starts = bucketStarts(window, interval)
  const topSourceOf = new Map(topSources.map((row) => [row.bucket, row.source]))
  const points = toPoints(starts, rows).map((point, index) => ({
    ...point,
    topSource: topSourceOf.get((starts[index] ?? 0) + offsetMs) ?? null,
  }))
  // Same length as `points`, so the chart can pair them by index. Week and
  // month buckets can split the previous period one bucket differently.
  const previousFound = toPoints(bucketStarts(previous, interval), previousRows)
  const previousPoints = starts.map(
    (start, index) =>
      previousFound[index] ?? {
        t: toOffsetIso(start - span, offsetMs),
        visitors: 0,
        pageviews: 0,
      }
  )
  return {
    interval,
    points,
    previousPoints,
    inProgress: window.toMs === now.getTime(),
  }
}

export async function getStatsBreakdown(
  db: Database,
  site: StatsSite,
  {
    by,
    limit,
    ...query
  }: StatsPeriod & StatsFilters & { by: BreakdownBy; limit: number },
  now: Date
): Promise<StatsBreakdownResponse> {
  const window = siteWindow(query, site.timezone, now)
  const rows = await getBreakdown(db, site.id, window.fromMs, window.toMs, {
    dimension: by,
    limit,
    filters: filtersOf(query),
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
  {
    limit,
    secret,
    ...query
  }: StatsPeriod & StatsFilters & { limit: number; secret: string },
  now: Date
): Promise<StatsVisitorsResponse> {
  const window = siteWindow(query, site.timezone, now)
  const activity = activityWindow(window.offsetMs, now)
  const [rows, pseudonymOf] = await Promise.all([
    getRecentVisitors(db, site.id, window.fromMs, window.toMs, {
      limit,
      filters: filtersOf(query),
      activity: { ...activity, offsetMs: window.offsetMs },
    }),
    createVisitorPseudonymizer(secret, site.id),
  ])
  const visitors = await Promise.all(
    rows.map(
      async ({ visitorId, firstSeenAt, lastSeenAt, activeDays, ...row }) => ({
        ...row,
        id: await pseudonymOf(visitorId),
        firstSeenAt: toIso(firstSeenAt),
        lastSeenAt: toIso(lastSeenAt),
        activeDays: activity.days.map((day) =>
          (activeDays ?? "").split(",").includes(String(day))
        ),
      })
    )
  )
  return { visitors }
}

const DAY_MS = 24 * 60 * 60 * 1000
const ACTIVITY_DAYS = 7

/** Today and the 6 days before it, local: the visitors list's activity dots. */
function activityWindow(offsetMs: number, now: Date) {
  const today = Math.floor((now.getTime() + offsetMs) / DAY_MS)
  const days = Array.from(
    { length: ACTIVITY_DAYS },
    (_, index) => today - (ACTIVITY_DAYS - 1) + index
  )
  return {
    days,
    fromMs: (today - (ACTIVITY_DAYS - 1)) * DAY_MS - offsetMs,
    toMs: now.getTime(),
  }
}
