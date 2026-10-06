import { type SQL, sql } from "drizzle-orm"

import { events } from "../schema"

// Channel rules: docs/metrics.md#channels. The one list of which source and
// utm_medium values make up each channel; the `source` values come from
// the referrer map (packages/contracts/src/referrers.ts) or
// a lowercased utm_source. Every value here is a bound parameter, so the
// whole CASE uses about 55 of D1's 100 parameters per statement.

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

const medium = sql`lower(${events.utmMedium})`

/**
 * The channel of a pageview as a SQL expression over its `source` and
 * `utm_medium`. First match wins: a paid newsletter link is `paid`. Anything
 * else with a source (github, a blog's hostname) is `referral`.
 */
export const channelOfPageview: SQL = sql`CASE
    WHEN ${medium} IN ${PAID_MEDIUMS} THEN ${"paid"}
    WHEN ${medium} IN ${EMAIL_VALUES} OR ${events.source} IN ${EMAIL_VALUES}
      THEN ${"email"}
    WHEN ${events.source} IS NULL OR ${events.source} = ${"direct"}
      THEN ${"direct"}
    WHEN ${events.source} IN ${SEARCH_SOURCES} THEN ${"search"}
    WHEN ${events.source} IN ${SOCIAL_SOURCES} THEN ${"social"}
    WHEN ${events.source} IN ${AI_SOURCES} THEN ${"ai"}
    ELSE ${"referral"}
  END`
