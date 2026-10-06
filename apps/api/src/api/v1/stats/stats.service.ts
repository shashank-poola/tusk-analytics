import type {
  BreakdownBy,
  StatsBreakdownResponse,
  StatsOverviewResponse,
  StatsRange,
  StatsTimeseriesResponse,
  StatsTotals,
} from "@workspace/contracts"
import {
  type Database,
  getBreakdown,
  getTimeseries,
  getTotals,
  type Site,
  type StatsTotalsRow,
} from "@workspace/db"

import { resolveRange, toOffsetIso } from "./stats.range"

// Metric definitions: docs/metrics.md. Every function takes `now` so tests
// can pin the range, and a site the caller has already checked ownership of.

type StatsSite = Pick<Site, "id" | "timezone">

function toTotals({ bounces, ...row }: StatsTotalsRow): StatsTotals {
  return { ...row, bounceRate: row.sessions === 0 ? 0 : bounces / row.sessions }
}

const toIso = (ms: number) => new Date(ms).toISOString()

export async function getStatsOverview(
  db: Database,
  site: StatsSite,
  range: StatsRange,
  now: Date
): Promise<StatsOverviewResponse> {
  const window = resolveRange(range, site.timezone, now)
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

/** One point per bucket in the range, zero-filled. */
export async function getStatsTimeseries(
  db: Database,
  site: StatsSite,
  range: StatsRange,
  now: Date
): Promise<StatsTimeseriesResponse> {
  const window = resolveRange(range, site.timezone, now)
  const rows = await getTimeseries(db, site.id, window.fromMs, window.toMs, {
    bucketMs: window.bucketMs,
    offsetMs: window.offsetMs,
  })
  const byBucket = new Map(rows.map((row) => [row.bucket, row]))

  const points = Array.from({ length: window.buckets }, (_, index) => {
    const bucket = window.firstBucket + index
    const row = byBucket.get(bucket)
    return {
      t: toOffsetIso(
        bucket * window.bucketMs - window.offsetMs,
        window.offsetMs
      ),
      visitors: row?.visitors ?? 0,
      pageviews: row?.pageviews ?? 0,
    }
  })
  return { interval: window.interval, points }
}

export async function getStatsBreakdown(
  db: Database,
  site: StatsSite,
  { range, by, limit }: { range: StatsRange; by: BreakdownBy; limit: number },
  now: Date
): Promise<StatsBreakdownResponse> {
  const window = resolveRange(range, site.timezone, now)
  const rows = await getBreakdown(db, site.id, window.fromMs, window.toMs, {
    dimension: by,
    limit,
  })
  return { by, rows }
}
