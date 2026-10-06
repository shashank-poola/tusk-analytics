import { type SQL, sql } from "drizzle-orm"

import type { Database } from "../client"
import { events } from "../schema"
import { pageviewsInRange } from "./pageviews-in-range"

// Metric definitions: docs/metrics.md. Every query reads one site's pageviews
// in [fromMs, toMs) through events_site_time_idx (site_id, created_at), and
// the caller must check that the signed-in user owns `siteId`.

export type StatsTotalsRow = {
  visitors: number
  pageviews: number
  sessions: number
  /** Sessions with exactly one pageview. */
  bounces: number
  /** Sum over sessions of (last pageview - first pageview), in ms. */
  sessionDurationMs: number
}

export type TimeseriesInterval = "hour" | "day" | "week" | "month"

type TimeseriesRow = {
  /** Start of the bucket in local ms (unix ms + offsetMs). */
  bucket: number
  visitors: number
  pageviews: number
}

/**
 * Two reads of the range: the per-session subquery runs once, not per row,
 * and yields both the bounce count and the session time. Measured against
 * one pass with a window count per session, it reads about a third fewer
 * rows, and D1 bills per row read.
 */
export async function getTotals(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number
): Promise<StatsTotalsRow> {
  const inRange = pageviewsInRange(siteId, fromMs, toMs)
  // `per_session` is a one-row aggregate, so its columns are the same on
  // every joined row; coalesce covers a range without pageviews. CROSS JOIN
  // fixes the loop order in SQLite: `per_session` outside, computed once.
  // Joined the other way round, the planner may rerun it per event.
  const [row] = await db.all<StatsTotalsRow>(sql`
    SELECT
      count(DISTINCT ${events.visitorId}) AS visitors,
      count(*) AS pageviews,
      count(DISTINCT ${events.sessionId}) AS sessions,
      coalesce(per_session.bounces, 0) AS bounces,
      coalesce(per_session.duration_ms, 0) AS sessionDurationMs
    FROM (
      SELECT
        sum(pageviews = 1) AS bounces,
        sum(last_at - first_at) AS duration_ms
      FROM (
        SELECT
          count(*) AS pageviews,
          min(${events.createdAt}) AS first_at,
          max(${events.createdAt}) AS last_at
        FROM ${events}
        WHERE ${inRange}
        GROUP BY ${events.sessionId}
      )
    ) AS per_session
    CROSS JOIN ${events}
    WHERE ${inRange}`)
  return (
    row ?? {
      visitors: 0,
      pageviews: 0,
      sessions: 0,
      bounces: 0,
      sessionDurationMs: 0,
    }
  )
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS
/** Day 0 of the Unix epoch was a Thursday; weeks start on Monday. */
const MONDAY_SHIFT_MS = 3 * DAY_MS

/**
 * The local start (unix ms + offsetMs) of the bucket a pageview falls in.
 * Matches `bucketStarts` in packages/contracts/src/stats-period.ts. CASTs
 * because D1 may bind the numbers as REAL, which would make `/` a float
 * division.
 */
function bucketOf(interval: TimeseriesInterval, offsetMs: number): SQL {
  const local = sql`(${events.createdAt} + ${offsetMs})`
  switch (interval) {
    case "hour":
    case "day": {
      const size = interval === "hour" ? HOUR_MS : DAY_MS
      return sql`CAST(${local} / ${size} AS INTEGER) * ${size}`
    }
    case "week":
      return sql`CAST((${local} + ${MONDAY_SHIFT_MS}) / ${WEEK_MS} AS INTEGER) * ${WEEK_MS} - ${MONDAY_SHIFT_MS}`
    case "month":
      return sql`CAST(strftime('%s', CAST(${local} / 1000 AS INTEGER), 'unixepoch', 'start of month') AS INTEGER) * 1000`
  }
}

/**
 * Pageviews and distinct visitors per bucket, for buckets that have events;
 * the caller zero-fills the rest. `offsetMs` shifts UTC to the site's local
 * time so buckets start at local midnight, on the local hour, on Monday or
 * on the 1st.
 */
export function getTimeseries(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  { interval, offsetMs }: { interval: TimeseriesInterval; offsetMs: number }
): Promise<TimeseriesRow[]> {
  return db.all<TimeseriesRow>(sql`
    SELECT
      ${bucketOf(interval, offsetMs)} AS bucket,
      count(DISTINCT ${events.visitorId}) AS visitors,
      count(*) AS pageviews
    FROM ${events}
    WHERE ${pageviewsInRange(siteId, fromMs, toMs)}
    GROUP BY bucket
    ORDER BY bucket`)
}

/** Distinct visitors with a pageview in [fromMs, toMs): "online now". */
export async function getLiveVisitors(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number
): Promise<number> {
  const [row] = await db.all<{ visitors: number }>(sql`
    SELECT count(DISTINCT ${events.visitorId}) AS visitors
    FROM ${events}
    WHERE ${pageviewsInRange(siteId, fromMs, toMs)}`)
  return row?.visitors ?? 0
}
