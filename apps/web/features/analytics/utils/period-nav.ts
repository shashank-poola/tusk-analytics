import {
  periodDays,
  resolveWindow,
  type StatsPeriod,
  utcOffsetMinutes,
} from "@workspace/contracts"

import { PRESET_LABELS } from "./analytics-params"
import { LOCALE } from "./format"

// Labels and the ‹ › steps of the period, in the site's time zone. The
// window math is the API's own (packages/contracts/src/stats-period.ts).

const DAY_MS = 24 * 60 * 60 * 1000

// Local ms (unix ms + offset) formatted in UTC, so nothing shifts them again.
const utc = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: "UTC" })
const monthDay = utc({ month: "short", day: "numeric" })
const monthDayYear = utc({ month: "short", day: "numeric", year: "numeric" })
const weekdayMonthDay = utc({
  weekday: "short",
  month: "short",
  day: "numeric",
})
const clock = utc({ hour: "numeric", minute: "2-digit" })

/** Today's date where the site is, `2026-10-06`. */
export function siteToday(timeZone: string, now: Date): string {
  const offsetMs = utcOffsetMinutes(timeZone, now) * 60_000
  return new Date(now.getTime() + offsetMs).toISOString().slice(0, 10)
}

/** The time where the site is, "9:38 PM". */
export function siteClock(timeZone: string, now: Date): string {
  const offsetMs = utcOffsetMinutes(timeZone, now) * 60_000
  return clock.format(now.getTime() + offsetMs)
}

function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10)
}

/** The period just before `period`, of the same length. */
export function previousPeriod(period: StatsPeriod): StatsPeriod {
  if (period.range !== "custom") {
    return { range: period.range, offset: period.offset + 1 }
  }
  const days = periodDays(period)
  return {
    range: "custom",
    from: shiftDate(period.from, -days),
    to: shiftDate(period.to, -days),
  }
}

/** The period just after `period`, or null when it would start after today. */
export function nextPeriod(
  period: StatsPeriod,
  today: string
): StatsPeriod | null {
  if (period.range !== "custom") {
    return period.offset === 0
      ? null
      : { range: period.range, offset: period.offset - 1 }
  }
  const days = periodDays(period)
  const from = shiftDate(period.from, days)
  if (from > today) return null
  return { range: "custom", from, to: shiftDate(period.to, days) }
}

/**
 * "Last 7 days" for a running preset, "Yesterday", or the dates it covers:
 * "Sep 23 – Sep 29", with the year when it isn't this year.
 */
export function periodLabel(
  period: StatsPeriod,
  timeZone: string,
  now: Date
): string {
  if (period.range !== "custom") {
    if (period.offset === 0) return PRESET_LABELS[period.range]
    if (period.range === "today" && period.offset === 1) return "Yesterday"
  }
  const offsetMs = utcOffsetMinutes(timeZone, now) * 60_000
  const { fromMs, endMs } = resolveWindow(period, offsetMs, now)
  const first = fromMs + offsetMs
  const last = endMs + offsetMs - 1
  if (period.range === "24h") {
    return `${monthDay.format(first)}, ${clock.format(first)} – ${monthDay.format(last)}, ${clock.format(last)}`
  }
  if (last - first < DAY_MS) return weekdayMonthDay.format(first)
  const thisYear = new Date(now.getTime() + offsetMs).getUTCFullYear()
  const format =
    new Date(first).getUTCFullYear() === thisYear &&
    new Date(last).getUTCFullYear() === thisYear
      ? monthDay
      : monthDayYear
  return `${format.format(first)} – ${format.format(last)}`
}
