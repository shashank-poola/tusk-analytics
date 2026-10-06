import { type SQL, sql } from "drizzle-orm"
import type { SQLiteColumn } from "drizzle-orm/sqlite-core"

import type { Database } from "../client"
import { events } from "../schema"
import { channelOfPageview } from "./channels"
import { pageviewsInRange } from "./pageviews-in-range"

// Metric definitions: docs/metrics.md#attribution. Reads one site's pageviews
// in [fromMs, toMs) through events_site_time_idx (site_id, created_at); the
// caller must check that the signed-in user owns `siteId`.

type SessionDimension = {
  key: SQLiteColumn | SQL
  /** The pageview the session takes its value from. Default: first. */
  pageview?: "first" | "last"
  /** Group by country too and return it (region and city names repeat). */
  withCountry?: true
}

/**
 * What a breakdown can group by per session. Fixed here so a request can
 * only pick a key, never a column name; `page` is grouped per event.
 */
const SESSION_DIMENSIONS = {
  source: { key: events.source },
  country: { key: events.country },
  device: { key: events.device },
  browser: { key: events.browser },
  os: { key: events.os },
  channel: { key: channelOfPageview },
  referrer: { key: events.referrer },
  campaign: { key: events.utmCampaign },
  entry_page: { key: events.path },
  exit_page: { key: events.path, pageview: "last" },
  region: { key: events.region, withCountry: true },
  city: { key: events.city, withCountry: true },
} satisfies Record<string, SessionDimension>

type BreakdownDimension = keyof typeof SESSION_DIMENSIONS | "page"

type BreakdownRow = {
  key: string | null
  visitors: number
  pageviews: number
  /** Only on `region` and `city` rows. */
  country?: string | null
}

/**
 * Top values of `dimension` by visitors, then key (unknown last).
 * `page` counts every pageview under its path. Other dimensions count each
 * session once, under the value of its first pageview in the range (its
 * last for `exit_page`), with all of the session's pageviews.
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

  const dimensionSpec: SessionDimension = SESSION_DIMENSIONS[dimension]
  const { key, pageview = "first", withCountry } = dimensionSpec
  // With exactly one min() or max() in a grouped query, SQLite takes the bare
  // columns (visitor_id, key, country) from the row holding it: the
  // session's first (or last) pageview in the range
  // (https://sqlite.org/lang_select.html#bareagg). One sort instead of the
  // two a row_number() window needs; it reads about a third of the rows.
  // Keep it the only min()/max() in this SELECT: a second one makes the bare
  // columns come from an arbitrary row.
  const pick = pageview === "first" ? sql`min` : sql`max`
  const andCountry = withCountry ? sql`, country` : sql``
  // An unknown region or city is one row, not one per country. Only built
  // for region/city: repeating `channel`'s CASE would double its bound
  // parameters past D1's 100.
  const countryColumn = withCountry
    ? sql`CASE WHEN ${key} IS NULL THEN NULL ELSE ${events.country} END AS country,`
    : sql``
  return db.all<BreakdownRow>(sql`
    WITH sessions AS (
      SELECT
        ${events.visitorId} AS visitor_id,
        ${key} AS key,
        ${countryColumn}
        ${pick}(${events.createdAt}) AS picked_at,
        count(*) AS pageviews
      FROM ${events}
      WHERE ${pageviewsInRange(siteId, fromMs, toMs)}
      GROUP BY ${events.sessionId}
    )
    SELECT
      key${andCountry},
      count(DISTINCT visitor_id) AS visitors,
      sum(pageviews) AS pageviews
    FROM sessions
    GROUP BY key${andCountry}
    ORDER BY visitors DESC, key IS NULL, key${andCountry}
    LIMIT ${limit}`)
}
