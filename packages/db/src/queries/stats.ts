import { sql } from "drizzle-orm"

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

type TimeseriesRow = {
  /** `floor((created_at + offsetMs) / bucketMs)`. */
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

/**
 * Pageviews and distinct visitors per bucket, for buckets that have events;
 * the caller zero-fills the rest. `offsetMs` shifts UTC to the site's local
 * time so buckets start at local midnight or on the local hour.
 */
export function getTimeseries(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  { bucketMs, offsetMs }: { bucketMs: number; offsetMs: number }
): Promise<TimeseriesRow[]> {
  // CAST because D1 may bind the numbers as REAL, which would make `/`
  // a float division.
  return db.all<TimeseriesRow>(sql`
    SELECT
      CAST((${events.createdAt} + ${offsetMs}) / ${bucketMs} AS INTEGER) AS bucket,
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
