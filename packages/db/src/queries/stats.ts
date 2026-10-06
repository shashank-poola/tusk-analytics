import { type SQL, sql } from "drizzle-orm"

import type { Database } from "../client"
import { events } from "../schema"

// Metric definitions: docs/metrics.md. Every query reads one site's pageviews
// in [fromMs, toMs) through events_site_time_idx (site_id, created_at), and
// the caller must check that the signed-in user owns `siteId`.

const PAGEVIEW = "pageview"

/**
 * Columns a breakdown can group by per session. Fixed here so a request can
 * only pick a key, never a column name; `page` is grouped per event.
 */
const SESSION_DIMENSIONS = {
  source: events.source,
  country: events.country,
  device: events.device,
  browser: events.browser,
  os: events.os,
}

type BreakdownDimension = keyof typeof SESSION_DIMENSIONS | "page"

export type StatsTotalsRow = {
  visitors: number
  pageviews: number
  sessions: number
  /** Sessions with exactly one pageview. */
  bounces: number
}

type TimeseriesRow = {
  /** `floor((created_at + offsetMs) / bucketMs)`. */
  bucket: number
  visitors: number
  pageviews: number
}

type BreakdownRow = {
  key: string | null
  visitors: number
  pageviews: number
}

function pageviewsInRange(siteId: string, fromMs: number, toMs: number): SQL {
  return sql`${events.siteId} = ${siteId}
    AND ${events.createdAt} >= ${fromMs}
    AND ${events.createdAt} < ${toMs}
    AND ${events.name} = ${PAGEVIEW}`
}

/**
 * Two reads of the range (the bounce count runs once, not per row). Measured
 * against one pass with a window count per session, it reads about a third
 * fewer rows, and D1 bills per row read.
 */
export async function getTotals(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number
): Promise<StatsTotalsRow> {
  const inRange = pageviewsInRange(siteId, fromMs, toMs)
  const [row] = await db.all<StatsTotalsRow>(sql`
    SELECT
      count(DISTINCT ${events.visitorId}) AS visitors,
      count(*) AS pageviews,
      count(DISTINCT ${events.sessionId}) AS sessions,
      (
        SELECT count(*) FROM (
          SELECT 1 FROM ${events}
          WHERE ${inRange}
          GROUP BY ${events.sessionId}
          HAVING count(*) = 1
        )
      ) AS bounces
    FROM ${events}
    WHERE ${inRange}`)
  return row ?? { visitors: 0, pageviews: 0, sessions: 0, bounces: 0 }
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

/**
 * Top values of `dimension` by visitors, then key (unknown last).
 * `page` counts every pageview under its path. Other dimensions count each
 * session once, under the value of its first pageview in the range, with
 * all of the session's pageviews.
 */
export function getBreakdown(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  { dimension, limit }: { dimension: BreakdownDimension; limit: number }
): Promise<BreakdownRow[]> {
  if (dimension === "page") {
    return db.all<BreakdownRow>(sql`
      SELECT
        ${events.path} AS key,
        count(DISTINCT ${events.visitorId}) AS visitors,
        count(*) AS pageviews
      FROM ${events}
      WHERE ${pageviewsInRange(siteId, fromMs, toMs)}
      GROUP BY key
      ORDER BY visitors DESC, key
      LIMIT ${limit}`)
  }

  const column = SESSION_DIMENSIONS[dimension]
  // With exactly one min() in a grouped query, SQLite takes the bare columns
  // (visitor_id, key) from the row holding the minimum: the session's first
  // pageview in the range (https://sqlite.org/lang_select.html#bareagg).
  // One sort instead of the two a row_number() window needs; it reads about
  // a third of the rows. Keep it the only min()/max() in this SELECT: a
  // second one makes the bare columns come from an arbitrary row.
  return db.all<BreakdownRow>(sql`
    WITH sessions AS (
      SELECT
        ${events.visitorId} AS visitor_id,
        ${column} AS key,
        min(${events.createdAt}) AS started_at,
        count(*) AS pageviews
      FROM ${events}
      WHERE ${pageviewsInRange(siteId, fromMs, toMs)}
      GROUP BY ${events.sessionId}
    )
    SELECT
      key,
      count(DISTINCT visitor_id) AS visitors,
      sum(pageviews) AS pageviews
    FROM sessions
    GROUP BY key
    ORDER BY visitors DESC, key IS NULL, key
    LIMIT ${limit}`)
}
