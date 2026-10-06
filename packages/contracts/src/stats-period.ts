import * as z from "zod"

// Periods, windows and buckets: docs/metrics.md#ranges. Shared by the API
// (which queries the window) and the dashboard (which labels it), so both
// agree on where a period starts and ends.

/** Presets end now (at `offset` 0); `custom` covers whole local days. */
export const statsRangeSchema = z.enum([
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

export const statsIntervalSchema = z.enum(["hour", "day", "week", "month"])
export type StatsInterval = z.infer<typeof statsIntervalSchema>

/** How many whole periods back a preset can step (`?offset=`). */
export const STATS_MAX_OFFSET = 1000
/** Longest custom period, in days. */
export const STATS_MAX_CUSTOM_DAYS = 366
/** Hourly buckets only for periods up to this many days (744 points). */
export const HOURLY_MAX_DAYS = 31

const presetRangeSchema = statsRangeSchema.exclude(["custom"])
/** A local calendar date, `2026-10-06`. */
const localDateSchema = z.iso.date()

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS
/** Day 0 of the Unix epoch was a Thursday; weeks start on Monday. */
const MONDAY_SHIFT_MS = 3 * DAY_MS

const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY_MS

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

const PRESET_DAYS = {
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
  const days = periodDays(period)
  return statsIntervalSchema.options.filter(
    (interval) => interval !== "hour" || days <= HOURLY_MAX_DAYS
  )
}

/** Hours for a day, days up to about three months, then months. */
export function defaultInterval(period: StatsPeriod): StatsInterval {
  const days = periodDays(period)
  if (days <= 2) return "hour"
  if (days <= 92) return "day"
  return "month"
}

export type StatsWindow = {
  /** Start of the period, inclusive, unix ms. */
  fromMs: number
  /** End of the period, exclusive: now for a period that is still running. */
  toMs: number
  /** End of the period at its full length; after `toMs` while it runs. */
  endMs: number
  /** The same length immediately before `fromMs`. */
  previousFromMs: number
  previousToMs: number
  /** The site's UTC offset at `now`, used for the whole window. */
  offsetMs: number
}

/** Minutes to add to UTC to get local time in `timeZone` at `at`. */
export function utcOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(at)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value)
  const localAsUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second")
  )
  const atSeconds = at.getTime() - at.getUTCMilliseconds()
  return Math.round((localAsUtc - atSeconds) / 60_000)
}

/**
 * Start and end of `period` in "local ms": unix ms shifted by the site's
 * offset, so local midnight is a multiple of a day.
 */
function localBounds(
  period: StatsPeriod,
  nowLocal: number
): { start: number; end: number } {
  if (period.range === "custom") {
    return {
      start: dayNumber(period.from) * DAY_MS,
      end: (dayNumber(period.to) + 1) * DAY_MS,
    }
  }
  const back = period.offset
  const today = Math.floor(nowLocal / DAY_MS) * DAY_MS
  switch (period.range) {
    case "today":
      return { start: today - back * DAY_MS, end: today + (1 - back) * DAY_MS }
    case "24h": {
      const span = 24 * HOUR_MS
      const end = (Math.floor(nowLocal / HOUR_MS) + 1) * HOUR_MS - back * span
      return { start: end - span, end }
    }
    case "7d":
    case "30d":
    case "90d": {
      const span = PRESET_DAYS[period.range] * DAY_MS
      const end = today + DAY_MS - back * span
      return { start: end - span, end }
    }
    case "12mo": {
      const date = new Date(today)
      const month = date.getUTCMonth() - 12 * back
      return {
        start: Date.UTC(date.getUTCFullYear(), month - 11, 1),
        end: Date.UTC(date.getUTCFullYear(), month + 1, 1),
      }
    }
  }
}

/** The window `period` covers for a site at `offsetMs`, ending at `now` at the latest. */
export function resolveWindow(
  period: StatsPeriod,
  offsetMs: number,
  now: Date
): StatsWindow {
  const nowMs = now.getTime()
  const { start, end } = localBounds(period, nowMs + offsetMs)
  const fromMs = start - offsetMs
  // A custom period that starts in the future is empty, not negative.
  const toMs = Math.max(fromMs, Math.min(nowMs, end - offsetMs))
  return {
    fromMs,
    toMs,
    endMs: end - offsetMs,
    previousFromMs: fromMs - (toMs - fromMs),
    previousToMs: fromMs,
    offsetMs,
  }
}

/** Start of the bucket holding `localMs`, in local ms. Weeks start on Monday. */
function bucketStartLocal(localMs: number, interval: StatsInterval): number {
  switch (interval) {
    case "hour":
      return Math.floor(localMs / HOUR_MS) * HOUR_MS
    case "day":
      return Math.floor(localMs / DAY_MS) * DAY_MS
    case "week":
      return (
        Math.floor((localMs + MONDAY_SHIFT_MS) / WEEK_MS) * WEEK_MS -
        MONDAY_SHIFT_MS
      )
    case "month": {
      const date = new Date(localMs)
      return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
    }
  }
}

function nextBucketLocal(startLocal: number, interval: StatsInterval): number {
  if (interval !== "month") {
    const size = { hour: HOUR_MS, day: DAY_MS, week: WEEK_MS }[interval]
    return startLocal + size
  }
  const date = new Date(startLocal)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
}

/**
 * Unix ms starts of every bucket in the period at its full length, in order,
 * so a running period includes the running bucket. The first may start
 * before `fromMs` (a week or month already under way).
 */
export function bucketStarts(
  {
    fromMs,
    endMs,
    offsetMs,
  }: Pick<StatsWindow, "fromMs" | "endMs" | "offsetMs">,
  interval: StatsInterval
): number[] {
  const starts: number[] = []
  const endLocal = endMs + offsetMs
  for (
    let local = bucketStartLocal(fromMs + offsetMs, interval);
    local < endLocal;
    local = nextBucketLocal(local, interval)
  ) {
    starts.push(local - offsetMs)
  }
  return starts
}
