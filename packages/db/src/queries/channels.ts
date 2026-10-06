import { type SQL, sql } from "drizzle-orm"

import { events } from "../schema"

// Channel rules: docs/metrics.md#channels. The one list of which source and
// utm_medium values make up each channel; the `source` values come from
// the referrer map (packages/contracts/src/referrers.ts) or
// a lowercased utm_source. The values are this file's constants, written
// into the SQL as literals: as bound parameters the CASE took about 55 of
// D1's 100 per statement, and a channel filter repeats it.

/** utm_medium values (compared lowercased) that mean a paid click. */
const PAID_MEDIUMS = [
  "cpc",
  "ppc",
  "cpm",
  "cpv",
  "paid",
  "paidsearch",
  "paid_search",
  "paid-search",
  "paidsocial",
  "paid_social",
  "paid-social",
  "display",
  "banner",
  "retargeting",
]

/** utm_medium or source values that mean an email. */
const EMAIL_VALUES = ["email", "e-mail", "newsletter"]

const SEARCH_SOURCES = [
  "google",
  "bing",
  "duckduckgo",
  "yahoo",
  "ecosia",
  "brave",
  "baidu",
  "yandex",
]

/** Includes the community sites ingest names: hackernews, producthunt. */
const SOCIAL_SOURCES = [
  "x",
  "twitter",
  "facebook",
  "instagram",
  "linkedin",
  "reddit",
  "youtube",
  "threads",
  "bluesky",
  "mastodon",
  "hackernews",
  "producthunt",
]

const AI_SOURCES = ["chatgpt", "perplexity", "claude", "gemini", "copilot"]

const SLUG = /^[a-z0-9_-]+$/

/** A constant from this file as a SQL string literal. Never pass input. */
function literal(value: string): SQL {
  if (!SLUG.test(value)) throw new Error(`Not a channel slug: ${value}`)
  return sql.raw(`'${value}'`)
}

function list(values: readonly string[]): SQL {
  return sql`(${sql.join(values.map(literal), sql`, `)})`
}

const medium = sql`lower(${events.utmMedium})`

/**
 * The channel of a pageview as a SQL expression over its `source` and
 * `utm_medium`. First match wins: a paid newsletter link is `paid`. Anything
 * else with a source (github, a blog's hostname) is `referral`.
 */
export const channelOfPageview: SQL = sql`CASE
    WHEN ${medium} IN ${list(PAID_MEDIUMS)} THEN ${literal("paid")}
    WHEN ${medium} IN ${list(EMAIL_VALUES)} OR ${events.source} IN ${list(EMAIL_VALUES)}
      THEN ${literal("email")}
    WHEN ${events.source} IS NULL OR ${events.source} = ${literal("direct")}
      THEN ${literal("direct")}
    WHEN ${events.source} IN ${list(SEARCH_SOURCES)} THEN ${literal("search")}
    WHEN ${events.source} IN ${list(SOCIAL_SOURCES)} THEN ${literal("social")}
    WHEN ${events.source} IN ${list(AI_SOURCES)} THEN ${literal("ai")}
    ELSE ${literal("referral")}
  END`
