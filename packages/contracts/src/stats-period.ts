import * as z from "zod"

// Periods and intervals: docs/metrics.md#ranges. Where a period starts and
// ends, and its buckets, are in stats-window.ts.

/**
 * Presets end now (at `offset` 0); `custom` covers whole local days.
 * `now` is the last 30 minutes, by the minute.
 */
export const statsRangeSchema = z.enum([
  "now",
  "today",
  "24h",
  "7d",
  "30d",
  "90d",
  "12mo",
  "custom",
])
export type StatsRange = z.infer<typeof statsRangeSchema>
export type PresetRange = Exclude<StatsRange, "custom">

export const statsIntervalSchema = z.enum([
  "minute",
  "hour",
  "day",
  "week",
  "month",
])
export type StatsInterval = z.infer<typeof statsIntervalSchema>

/** How many whole periods back a preset can step (`?offset=`). */
export const STATS_MAX_OFFSET = 1000
/** Longest custom period, in days. */
export const STATS_MAX_CUSTOM_DAYS = 366
/** Hourly buckets only for periods up to this many days (744 points). */
export const HOURLY_MAX_DAYS = 31
/** The `now` period's length. */
export const NOW_MINUTES = 30

const presetRangeSchema = statsRangeSchema.exclude(["custom"])
/** A local calendar date, `2026-10-06`. */
const localDateSchema = z.iso.date()

const DAY_MS = 24 * 60 * 60 * 1000

/** Days since the Unix epoch of a local date, `2026-10-06`. */
export const dayNumber = (date: string) =>
  Date.parse(`${date}T00:00:00Z`) / DAY_MS

/**
 * The period of every stats request. A preset ends now, or `offset` whole
 * periods earlier ("the 7 days before the last 7"); a custom period runs
 * from the start of `from` to the end of `to`, in the site's time zone.
 */
export const statsPeriodSchema = z.discriminatedUnion("range", [
  z.object({
    range: presetRangeSchema,
    offset: z.coerce.number().int().min(0).max(STATS_MAX_OFFSET).default(0),
  }),
  z
    .object({
      range: z.literal("custom"),
      from: localDateSchema,
      to: localDateSchema,
    })
    .refine(({ from, to }) => from <= to, {
      message: "must be on or after from",
      path: ["to"],
    })
    .refine(
      ({ from, to }) => dayNumber(to) - dayNumber(from) < STATS_MAX_CUSTOM_DAYS,
      {
        message: `a custom period is at most ${STATS_MAX_CUSTOM_DAYS} days`,
        path: ["to"],
      }
    ),
])
export type StatsPeriod = z.infer<typeof statsPeriodSchema>

export const PRESET_DAYS = {
  now: 1,
  today: 1,
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12mo": 366,
} as const satisfies Record<PresetRange, number>

/** Days a period spans at its full length, e.g. 7 for `7d`. */
export function periodDays(period: StatsPeriod): number {
  if (period.range !== "custom") return PRESET_DAYS[period.range]
  return dayNumber(period.to) - dayNumber(period.from) + 1
}

/** Intervals that make a readable chart of `period`. */
export function allowedIntervals(period: StatsPeriod): StatsInterval[] {
  // Minutes only for `now`, and `now` only by the minute.
  if (period.range === "now") return ["minute"]
  const days = periodDays(period)
  return statsIntervalSchema.options.filter(
    (interval) =>
      interval !== "minute" && (interval !== "hour" || days <= HOURLY_MAX_DAYS)
  )
}

/** Hours for a day, days up to about three months, then months. */
export function defaultInterval(period: StatsPeriod): StatsInterval {
  if (period.range === "now") return "minute"
  const days = periodDays(period)
  if (days <= 2) return "hour"
  if (days <= 92) return "day"
  return "month"
}
