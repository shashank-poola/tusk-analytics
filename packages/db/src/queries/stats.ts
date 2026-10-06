import { sql } from "drizzle-orm"

import type { Database } from "../client"
import { events } from "../schema"
import { bucketOf, type TimeseriesInterval } from "./buckets"
import { pageviewsInRange } from "./pageviews-in-range"
import type { SessionFilters } from "./session-filters"

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
  toMs: number,
  filters: SessionFilters = {}
): Promise<StatsTotalsRow> {
  const inRange = pageviewsInRange(siteId, fromMs, toMs, filters)
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
 * time so buckets start at local midnight, on the local hour, on Monday or
 * on the 1st.
 */
export function getTimeseries(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  {
    interval,
    offsetMs,
    filters = {},
  }: {
    interval: TimeseriesInterval
    offsetMs: number
    filters?: SessionFilters
  }
): Promise<TimeseriesRow[]> {
  return db.all<TimeseriesRow>(sql`
    SELECT
      ${bucketOf(interval, offsetMs)} AS bucket,
      count(DISTINCT ${events.visitorId}) AS visitors,
      count(*) AS pageviews
    FROM ${events}
    WHERE ${pageviewsInRange(siteId, fromMs, toMs, filters)}
    GROUP BY bucket
    ORDER BY bucket`)
}

type TopSourceRow = {
  /** Start of the bucket in local ms, as in `getTimeseries`. */
  bucket: number
  source: string
}

/**
 * The source that brought the most visitors in each bucket, by the bucket
 * of each session's first pageview in the range; direct visits don't count.
 * Ties go to the source that sorts first. Buckets without such sessions
 * have no row. Sessions use the same bare-column min() as `getBreakdown`.
 */
export function getTopSourceByBucket(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  {
    interval,
    offsetMs,
    filters = {},
  }: {
    interval: TimeseriesInterval
    offsetMs: number
    filters?: SessionFilters
  }
): Promise<TopSourceRow[]> {
  return db.all<TopSourceRow>(sql`
    WITH sessions AS (
      SELECT
        ${events.visitorId} AS visitor_id,
        ${events.source} AS source,
        min(${events.createdAt}) AS first_at
      FROM ${events}
      WHERE ${pageviewsInRange(siteId, fromMs, toMs, filters)}
      GROUP BY ${events.sessionId}
    ),
    per_bucket AS (
      SELECT
        ${bucketOf(interval, offsetMs, sql`first_at`)} AS bucket,
        source,
        count(DISTINCT visitor_id) AS visitors
      FROM sessions
      WHERE source IS NOT NULL AND source <> ${"direct"}
      GROUP BY bucket, source
    )
    SELECT bucket, source FROM (
      SELECT
        bucket,
        source,
        row_number() OVER (
          PARTITION BY bucket ORDER BY visitors DESC, source
        ) AS rank
      FROM per_bucket
    )
    WHERE rank = 1
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
