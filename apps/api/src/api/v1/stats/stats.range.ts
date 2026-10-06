import type { StatsInterval, StatsRange } from "@workspace/contracts"

// Range and bucket rules: docs/metrics.md#ranges.

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

const RANGES = {
  "24h": { interval: "hour", buckets: 24 },
  "7d": { interval: "day", buckets: 7 },
  "30d": { interval: "day", buckets: 30 },
  "90d": { interval: "day", buckets: 90 },
} as const satisfies Record<
  StatsRange,
  { interval: StatsInterval; buckets: number }
>

const BUCKET_MS = { hour: HOUR_MS, day: DAY_MS } as const

type StatsWindow = {
  fromMs: number
  toMs: number
  previousFromMs: number
  previousToMs: number
  interval: StatsInterval
  bucketMs: number
  /** The site's UTC offset at `toMs`, used for the whole range. */
  offsetMs: number
  /** Bucket number of `fromMs`: `floor((ms + offsetMs) / bucketMs)`. */
  firstBucket: number
  buckets: number
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

/** The current and previous period of `range` for a site in `timeZone`. */
export function resolveRange(
  range: StatsRange,
  timeZone: string,
  now: Date
): StatsWindow {
  const { interval, buckets } = RANGES[range]
  const bucketMs = BUCKET_MS[interval]
  const offsetMs = utcOffsetMinutes(timeZone, now) * 60_000
  const toMs = now.getTime()
  const firstBucket = Math.floor((toMs + offsetMs) / bucketMs) - (buckets - 1)
  const fromMs = firstBucket * bucketMs - offsetMs
  return {
    fromMs,
    toMs,
    previousFromMs: fromMs - (toMs - fromMs),
    previousToMs: fromMs,
    interval,
    bucketMs,
    offsetMs,
    firstBucket,
    buckets,
  }
}

/** `ms` as an ISO string in local time with its offset, e.g. `…T00:00:00.000+05:30`. */
export function toOffsetIso(ms: number, offsetMs: number): string {
  const local = new Date(ms + offsetMs).toISOString().slice(0, -1)
  const minutes = Math.abs(offsetMs) / 60_000
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0")
  const mm = String(minutes % 60).padStart(2, "0")
  return `${local}${offsetMs < 0 ? "-" : "+"}${hh}:${mm}`
}
