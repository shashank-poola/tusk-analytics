import { type SQL, sql } from "drizzle-orm"
import type { SQLiteColumn } from "drizzle-orm/sqlite-core"

import type { Database } from "../client"
import { events } from "../schema"
import { channelOfPageview } from "./channels"
import { outboundClicksInRange, pageviewsInRange } from "./pageviews-in-range"
import type { SessionFilters } from "./session-filters"

// Metric definitions: docs/metrics.md#attribution. Reads one site's events
// in [fromMs, toMs) through events_site_time_idx (site_id, created_at); the
// caller must check that the signed-in user owns `siteId`.

type SessionDimension = {
  key: SQLiteColumn | SQL
  /** The pageview the session takes its value from. Default: first. */
  pageview?: "first" | "last"
  /** Group by country too and return it (region and city names repeat). */
  withCountry?: true
  /** Leave out sessions without a value (no campaign is not a campaign). */
  skipNull?: true
}

/**
 * What a breakdown can group by per session. Fixed here so a request can
 * only pick a key, never a column name; `page`, `hostname` and `exit_link`
 * are grouped per event.
 */
const SESSION_DIMENSIONS = {
  source: { key: events.source },
  country: { key: events.country },
  device: { key: events.device },
  browser: { key: events.browser },
  os: { key: events.os },
  channel: { key: channelOfPageview },
  referrer: { key: events.referrer },
  campaign: { key: events.campaignParams, skipNull: true },
  entry_page: { key: events.path },
  exit_page: { key: events.path, pageview: "last" },
  region: { key: events.region, withCountry: true },
  city: { key: events.city, withCountry: true },
} satisfies Record<string, SessionDimension>

/** Grouped per pageview: each pageview counts under its own value. */
const PAGEVIEW_DIMENSIONS = {
  page: events.path,
  hostname: events.hostname,
} satisfies Record<string, SQLiteColumn>

type BreakdownDimension =
  | keyof typeof SESSION_DIMENSIONS
  | keyof typeof PAGEVIEW_DIMENSIONS
  | "exit_link"

type BreakdownRow = {
  key: string | null
  visitors: number
  /** Pageviews; for `exit_link`, clicks. */
  pageviews: number
  /** Only on `region` and `city` rows. */
  country?: string | null
  /** Only on `channel` rows. */
  topSources?: string[]
}

type BreakdownOptions = {
  dimension: BreakdownDimension
  limit: number
  filters?: SessionFilters
}

const OUTBOUND_URL = sql`json_extract(${events.props}, '$.url')`
/** Source icons per channel row. */
const CHANNEL_TOP_SOURCES = 3

/**
 * Top values of `dimension` by visitors, then key (unknown last).
 * `page` and `hostname` count every pageview under its value, `exit_link`
 * every outbound click under its link. Other dimensions count each session
 * once, under the value of its first pageview in the range (its last for
 * `exit_page`), with all of the session's pageviews.
 */
export async function getBreakdown(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  { dimension, limit, filters = {} }: BreakdownOptions
): Promise<BreakdownRow[]> {
  if (dimension === "exit_link") {
    return db.all<BreakdownRow>(sql`
      SELECT
        ${OUTBOUND_URL} AS key,
        count(DISTINCT ${events.visitorId}) AS visitors,
        count(*) AS pageviews
      FROM ${events}
      WHERE ${outboundClicksInRange(siteId, fromMs, toMs, filters)}
        AND ${OUTBOUND_URL} IS NOT NULL
      GROUP BY key
      ORDER BY visitors DESC, key
      LIMIT ${limit}`)
  }

  if (dimension === "page" || dimension === "hostname") {
    const key = PAGEVIEW_DIMENSIONS[dimension]
    return db.all<BreakdownRow>(sql`
      SELECT
        ${key} AS key,
        count(DISTINCT ${events.visitorId}) AS visitors,
        count(*) AS pageviews
      FROM ${events}
      WHERE ${pageviewsInRange(siteId, fromMs, toMs, filters)}
      GROUP BY key
      ORDER BY visitors DESC, key IS NULL, key
      LIMIT ${limit}`)
  }

  if (dimension === "channel") {
    const [rows, sources] = await Promise.all([
      sessionBreakdown(db, siteId, fromMs, toMs, dimension, limit, filters),
      topSourcesByChannel(db, siteId, fromMs, toMs, filters),
    ])
    return rows.map((row) => ({
      ...row,
      topSources: sources.get(row.key ?? "") ?? [],
    }))
  }

  return sessionBreakdown(db, siteId, fromMs, toMs, dimension, limit, filters)
}

function sessionBreakdown(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  dimension: keyof typeof SESSION_DIMENSIONS,
  limit: number,
  filters: SessionFilters
): Promise<BreakdownRow[]> {
  const dimensionSpec: SessionDimension = SESSION_DIMENSIONS[dimension]
  const { key, pageview = "first", withCountry, skipNull } = dimensionSpec
  // With exactly one min() or max() in a grouped query, SQLite takes the bare
  // columns (visitor_id, key, country) from the row holding it: the
  // session's first (or last) pageview in the range
  // (https://sqlite.org/lang_select.html#bareagg). One sort instead of the
  // two a row_number() window needs; it reads about a third of the rows.
  // Keep it the only min()/max() in this SELECT: a second one makes the bare
  // columns come from an arbitrary row.
  const pick = pageview === "first" ? sql`min` : sql`max`
  const andCountry = withCountry ? sql`, country` : sql``
  // An unknown region or city is one row, not one per country.
  const countryColumn = withCountry
    ? sql`CASE WHEN ${key} IS NULL THEN NULL ELSE ${events.country} END AS country,`
    : sql``
  const whereKnown = skipNull ? sql`WHERE key IS NOT NULL` : sql``
  return db.all<BreakdownRow>(sql`
    WITH sessions AS (
      SELECT
        ${events.visitorId} AS visitor_id,
        ${key} AS key,
        ${countryColumn}
        ${pick}(${events.createdAt}) AS picked_at,
        count(*) AS pageviews
      FROM ${events}
      WHERE ${pageviewsInRange(siteId, fromMs, toMs, filters)}
      GROUP BY ${events.sessionId}
    )
    SELECT
      key${andCountry},
      count(DISTINCT visitor_id) AS visitors,
      sum(pageviews) AS pageviews
    FROM sessions
    ${whereKnown}
    GROUP BY key${andCountry}
    ORDER BY visitors DESC, key IS NULL, key${andCountry}
    LIMIT ${limit}`)
}

/**
 * Each channel's top sources by visitors, for the icons around the channel
 * chart. Sessions count under their first pageview, like the breakdown.
 */
async function topSourcesByChannel(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  filters: SessionFilters
): Promise<Map<string, string[]>> {
  const rows = await db.all<{ channel: string; source: string }>(sql`
    WITH sessions AS (
      SELECT
        ${events.visitorId} AS visitor_id,
        ${channelOfPageview} AS channel,
        ${events.source} AS source,
        min(${events.createdAt}) AS first_at
      FROM ${events}
      WHERE ${pageviewsInRange(siteId, fromMs, toMs, filters)}
      GROUP BY ${events.sessionId}
    ),
    per_source AS (
      SELECT channel, source, count(DISTINCT visitor_id) AS visitors
      FROM sessions
      WHERE source IS NOT NULL
      GROUP BY channel, source
    )
    SELECT channel, source FROM (
      SELECT
        channel,
        source,
        row_number() OVER (
          PARTITION BY channel ORDER BY visitors DESC, source
        ) AS rank
      FROM per_source
    )
    WHERE rank <= ${CHANNEL_TOP_SOURCES}
    ORDER BY channel, rank`)
  const byChannel = new Map<string, string[]>()
  for (const { channel, source } of rows) {
    byChannel.set(channel, [...(byChannel.get(channel) ?? []), source])
  }
  return byChannel
}
