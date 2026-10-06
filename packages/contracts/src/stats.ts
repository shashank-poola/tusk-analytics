import * as z from "zod"

// Definitions of every metric: docs/metrics.md.

export const statsRangeSchema = z.enum(["24h", "7d", "30d", "90d"])
export type StatsRange = z.infer<typeof statsRangeSchema>

/** `page` is counted per event; every other dimension per session. */
export const breakdownBySchema = z.enum([
  "source",
  "page",
  "country",
  "device",
  "browser",
  "os",
])
export type BreakdownBy = z.infer<typeof breakdownBySchema>

export const BREAKDOWN_DEFAULT_LIMIT = 10
export const BREAKDOWN_MAX_LIMIT = 50

const count = z.number().int().nonnegative()

export const statsTotalsSchema = z.object({
  visitors: count,
  pageviews: count,
  sessions: count,
  /** Share of sessions with one pageview, from 0 to 1. */
  bounceRate: z.number().min(0).max(1),
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

export const statsIntervalSchema = z.enum(["hour", "day"])
export type StatsInterval = z.infer<typeof statsIntervalSchema>

export const statsTimeseriesResponseSchema = z.object({
  interval: statsIntervalSchema,
  points: z.array(
    z.object({
      /** Bucket start in the site's UTC offset, e.g. `2026-10-06T00:00:00.000+05:30`. */
      t: z.iso.datetime({ offset: true }),
      visitors: count,
      pageviews: count,
    })
  ),
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
      pageviews: count,
    })
  ),
})
export type StatsBreakdownResponse = z.infer<
  typeof statsBreakdownResponseSchema
>
