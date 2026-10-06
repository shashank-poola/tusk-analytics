import { sql } from "drizzle-orm"

import type { Database } from "../client"
import { events } from "../schema"
import { pageviewsInRange } from "./pageviews-in-range"
import type { SessionFilters } from "./session-filters"

// Definition: docs/metrics.md#visitors-list. The caller must check that the
// signed-in user owns `siteId`.

export type RecentVisitorRow = {
  visitorId: string
  source: string | null
  country: string | null
  region: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  pageviews: number
  sessions: number
  /** Unix ms of the visitor's first pageview in the range. */
  firstSeenAt: number
  /** Unix ms of the visitor's latest pageview in the range. */
  lastSeenAt: number
  lastPage: string
  /**
   * Local day numbers (`floor((ms + offset) / day)`) with a pageview in the
   * activity window, comma-separated; null when none.
   */
  activeDays: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The `limit` visitors with the latest pageviews in [fromMs, toMs), latest
 * first. Both CTEs read the range through events_site_time_idx
 * (site_id, created_at): `recent` keeps the top `limit` visitors, then
 * `first_touch` aggregates only their pageviews, so the range is read twice
 * and nothing runs per visitor. Each CTE has exactly one max()/min(), so
 * SQLite takes its bare columns (path, source, ...) from the latest or
 * earliest pageview (https://sqlite.org/lang_select.html#bareagg).
 * `activity` reads the activity window (a week) once more for the same
 * visitors, whatever the range or filters.
 */
export function getRecentVisitors(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  {
    limit,
    filters = {},
    activity,
  }: {
    limit: number
    filters?: SessionFilters
    /** The days whose activity the list shows, and the site's offset. */
    activity: { fromMs: number; toMs: number; offsetMs: number }
  }
): Promise<RecentVisitorRow[]> {
  const inRange = pageviewsInRange(siteId, fromMs, toMs, filters)
  const inActivityWindow = pageviewsInRange(
    siteId,
    activity.fromMs,
    activity.toMs
  )
  return db.all<RecentVisitorRow>(sql`
    WITH recent AS (
      SELECT
        ${events.visitorId} AS visitor_id,
        ${events.path} AS last_page,
        max(${events.createdAt}) AS last_seen_at
      FROM ${events}
      WHERE ${inRange}
      GROUP BY ${events.visitorId}
      ORDER BY last_seen_at DESC, visitor_id
      LIMIT ${limit}
    ),
    first_touch AS (
      SELECT
        ${events.visitorId} AS visitor_id,
        ${events.source} AS source,
        ${events.country} AS country,
        ${events.region} AS region,
        ${events.city} AS city,
        ${events.device} AS device,
        ${events.browser} AS browser,
        ${events.os} AS os,
        min(${events.createdAt}) AS first_seen_at,
        count(*) AS pageviews,
        count(DISTINCT ${events.sessionId}) AS sessions
      FROM ${events}
      WHERE ${inRange}
        AND ${events.visitorId} IN (SELECT visitor_id FROM recent)
      GROUP BY ${events.visitorId}
    ),
    activity AS (
      SELECT visitor_id, group_concat(day) AS days FROM (
        SELECT DISTINCT
          ${events.visitorId} AS visitor_id,
          CAST((${events.createdAt} + ${activity.offsetMs}) / ${DAY_MS} AS INTEGER) AS day
        FROM ${events}
        WHERE ${inActivityWindow}
          AND ${events.visitorId} IN (SELECT visitor_id FROM recent)
      )
      GROUP BY visitor_id
    )
    SELECT
      recent.visitor_id AS visitorId,
      source, country, region, city, device, browser, os,
      pageviews, sessions,
      first_seen_at AS firstSeenAt,
      last_seen_at AS lastSeenAt,
      last_page AS lastPage,
      activity.days AS activeDays
    FROM recent
    JOIN first_touch ON first_touch.visitor_id = recent.visitor_id
    LEFT JOIN activity ON activity.visitor_id = recent.visitor_id
    ORDER BY last_seen_at DESC, recent.visitor_id`)
}
