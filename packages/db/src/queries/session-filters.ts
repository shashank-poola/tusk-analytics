import { type SQL, sql } from "drizzle-orm"
import type { SQLiteColumn } from "drizzle-orm/sqlite-core"

import { events } from "../schema"
import { channelOfPageview } from "./channels"

// Filter rules: docs/metrics.md#filters. A filter keeps whole sessions, so
// every metric stays consistent (a session's bounce, its pageviews, its
// visitor): by the value of its first pageview in the range, by any of its
// pageviews, or by an outbound click.

type FilterSpec =
  | { match: "first_pageview"; key: SQLiteColumn | SQL }
  | { match: "any_pageview"; key: SQLiteColumn }
  | { match: "outbound_click" }

/** What a request can filter by. Fixed here: a request picks a key, never a column. */
const FILTERS = {
  channel: { match: "first_pageview", key: channelOfPageview },
  source: { match: "first_pageview", key: events.source },
  campaign: { match: "first_pageview", key: events.campaignParams },
  entry_page: { match: "first_pageview", key: events.path },
  country: { match: "first_pageview", key: events.country },
  region: { match: "first_pageview", key: events.region },
  city: { match: "first_pageview", key: events.city },
  browser: { match: "first_pageview", key: events.browser },
  os: { match: "first_pageview", key: events.os },
  device: { match: "first_pageview", key: events.device },
  hostname: { match: "any_pageview", key: events.hostname },
  page: { match: "any_pageview", key: events.path },
  exit_link: { match: "outbound_click" },
} satisfies Record<string, FilterSpec>

export type FilterDimension = keyof typeof FILTERS
export type SessionFilters = Partial<Record<FilterDimension, string>>

/** Unfiltered event conditions the filters select sessions from. */
type FilterSources = { pageviews: SQL; outboundClicks: SQL }

function matchingSessions(
  spec: FilterSpec,
  value: string,
  { pageviews, outboundClicks }: FilterSources
): SQL {
  switch (spec.match) {
    case "first_pageview":
      // One min() per group: SQLite takes `k` from the session's first
      // pageview (https://sqlite.org/lang_select.html#bareagg).
      return sql`SELECT session_id FROM (
          SELECT
            ${events.sessionId} AS session_id,
            ${spec.key} AS k,
            min(${events.createdAt})
          FROM ${events}
          WHERE ${pageviews}
          GROUP BY ${events.sessionId}
        )
        WHERE k = ${value}`
    case "any_pageview":
      return sql`SELECT ${events.sessionId} FROM ${events}
        WHERE ${pageviews} AND ${spec.key} = ${value}`
    case "outbound_click":
      return sql`SELECT ${events.sessionId} FROM ${events}
        WHERE ${outboundClicks}
          AND json_extract(${events.props}, '$.url') = ${value}`
  }
}

/** `AND session_id IN (…)` once per filter, or nothing without filters. */
export function sessionFilterSql(
  sources: FilterSources,
  filters: SessionFilters
): SQL {
  const dimensions = Object.keys(FILTERS) as FilterDimension[]
  const clauses = dimensions.flatMap((dimension) => {
    const value = filters[dimension]
    if (!value) return []
    const spec: FilterSpec = FILTERS[dimension]
    return [
      sql` AND ${events.sessionId} IN (${matchingSessions(spec, value, sources)})`,
    ]
  })
  return sql.join(clauses)
}
