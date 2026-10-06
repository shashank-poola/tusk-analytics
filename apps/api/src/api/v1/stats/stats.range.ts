import {
  allowedIntervals,
  defaultInterval,
  HOURLY_MAX_DAYS,
  resolveWindow,
  type StatsInterval,
  type StatsPeriod,
  type StatsWindow,
  utcOffsetMinutes,
} from "@workspace/contracts"

import { AppError } from "../../../lib/errors"

// Period and bucket rules: docs/metrics.md#ranges; the window math is
// shared with the dashboard in packages/contracts/src/stats-period.ts.

/** The window of `period` for a site in `timeZone`, at its offset now. */
export function siteWindow(
  period: StatsPeriod,
  timeZone: string,
  now: Date
): StatsWindow {
  const offsetMs = utcOffsetMinutes(timeZone, now) * 60_000
  return resolveWindow(period, offsetMs, now)
}

/** `interval`, or the period's default; a 400 when it would draw too many points. */
export function chartInterval(
  period: StatsPeriod,
  interval: StatsInterval | undefined
): StatsInterval {
  if (!interval) return defaultInterval(period)
  if (!allowedIntervals(period).includes(interval)) {
    throw new AppError(
      "bad_request",
      `interval: hourly buckets need a period of ${HOURLY_MAX_DAYS} days or less; pick day, week or month`
    )
  }
  return interval
}

/** `ms` as an ISO string in local time with its offset, e.g. `…T00:00:00.000+05:30`. */
export function toOffsetIso(ms: number, offsetMs: number): string {
  const local = new Date(ms + offsetMs).toISOString().slice(0, -1)
  const minutes = Math.abs(offsetMs) / 60_000
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0")
  const mm = String(minutes % 60).padStart(2, "0")
  return `${local}${offsetMs < 0 ? "-" : "+"}${hh}:${mm}`
}
