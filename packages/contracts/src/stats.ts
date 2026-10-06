import * as z from "zod"

import { statsIntervalSchema } from "./stats-period"

// Definitions of every metric: docs/metrics.md.

/**
 * `page`, `hostname` and `exit_link` are counted per event; every other
 * dimension per session. `entry_page` and `exit_page` are a session's first
 * and last path in the range; `region` and `city` rows also carry their
 * `country`. `exit_link` is the host and path of outbound link clicks.
 */
export const breakdownBySchema = z.enum([
  "source",
  "page",
  "country",
  "device",
  "browser",
  "os",
  "channel",
  "referrer",
  "campaign",
  "entry_page",
  "exit_page",
  "region",
  "city",
  "hostname",
  "exit_link",
])
export type BreakdownBy = z.infer<typeof breakdownBySchema>

export const BREAKDOWN_DEFAULT_LIMIT = 10
/** Enough for every country, so the world map can colour them all. */
export const BREAKDOWN_MAX_LIMIT = 250

const count = z.number().int().nonnegative()

export const statsTotalsSchema = z.object({
  visitors: count,
  pageviews: count,
  sessions: count,
  /** Share of sessions with one pageview, from 0 to 1. */
  bounceRate: z.number().min(0).max(1),
  /** Mean of (last pageview - first pageview) per session, in seconds. */
  avgSessionSeconds: z.number().nonnegative(),
})
export type StatsTotals = z.infer<typeof statsTotalsSchema>

export const statsOverviewResponseSchema = z.object({
  range: z.object({
    from: z.iso.datetime(),
    to: z.iso.datetime(),
    previousFrom: z.iso.datetime(),
    previousTo: z.iso.datetime(),
  }),
  current: statsTotalsSchema,
  previous: statsTotalsSchema,
})
export type StatsOverviewResponse = z.infer<typeof statsOverviewResponseSchema>

const timeseriesPointSchema = z.object({
  /** Bucket start in the site's UTC offset, e.g. `2026-10-06T00:00:00.000+05:30`. */
  t: z.iso.datetime({ offset: true }),
  visitors: count,
  pageviews: count,
})

export const statsTimeseriesResponseSchema = z.object({
  interval: statsIntervalSchema,
  points: z.array(
    timeseriesPointSchema.extend({
      /**
       * The source that brought the most visitors in this bucket, direct
       * excluded; null when none did. Untrusted: render as text.
       */
      topSource: z.string().nullable(),
    })
  ),
  /**
   * The full period before, bucket by bucket, aligned with `points` by
   * index (same length).
   */
  previousPoints: z.array(timeseriesPointSchema),
  /** True while the last point's bucket is still running (the period ends now). */
  inProgress: z.boolean(),
})
export type StatsTimeseriesResponse = z.infer<
  typeof statsTimeseriesResponseSchema
>

export const statsBreakdownResponseSchema = z.object({
  by: breakdownBySchema,
  rows: z.array(
    z.object({
      /** Tracker-derived and untrusted: render as text. Null when unknown. */
      key: z.string().nullable(),
      visitors: count,
      /** Pageviews; for `exit_link`, clicks on the link. */
      pageviews: count,
      /** ISO 3166-1 alpha-2, only on `region` and `city` rows. */
      country: z.string().nullable().optional(),
      /**
       * Only on `channel` rows: its top sources by visitors, at most
       * three. Untrusted: render as text.
       */
      topSources: z.array(z.string()).optional(),
    })
  ),
})
export type StatsBreakdownResponse = z.infer<
  typeof statsBreakdownResponseSchema
>

/** Keys of the `channel` breakdown, derived from source and utm_medium. */
export const channelSchema = z.enum([
  "direct",
  "search",
  "social",
  "ai",
  "email",
  "paid",
  "referral",
])
export type Channel = z.infer<typeof channelSchema>

/** "Online": distinct visitors with a pageview in the last few minutes. */
export const LIVE_WINDOW_MINUTES = 5

export const statsLiveResponseSchema = z.object({ visitors: count })
export type StatsLiveResponse = z.infer<typeof statsLiveResponseSchema>

export const VISITORS_DEFAULT_LIMIT = 20
export const VISITORS_MAX_LIMIT = 50

const nullableText = z.string().nullable()

/** Recent visitors in the range, latest first. Every text field is untrusted. */
export const statsVisitorsResponseSchema = z.object({
  visitors: z.array(
    z.object({
      /** Site-scoped pseudonym of the visitor (not the tracker cookie id); stable, used as an avatar seed and list key. */
      id: z.string(),
      /** Values of the visitor's first pageview in the range. */
      source: nullableText,
      country: nullableText,
      region: nullableText,
      city: nullableText,
      device: nullableText,
      browser: nullableText,
      os: nullableText,
      pageviews: count,
      sessions: count,
      firstSeenAt: z.iso.datetime(),
      lastSeenAt: z.iso.datetime(),
      /** Path of the latest pageview in the range. */
      lastPage: z.string(),
    })
  ),
})
export type StatsVisitorsResponse = z.infer<typeof statsVisitorsResponseSchema>
export type StatsVisitor = StatsVisitorsResponse["visitors"][number]
