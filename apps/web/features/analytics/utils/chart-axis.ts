import type { StatsInterval } from "@workspace/contracts"

import { LOCALE } from "./format"

// `t` carries the site's offset (`2026-10-06T14:00:00.000+05:30`), so its
// date and time digits are already local: read them directly, and format
// the date in UTC so nothing shifts it again.

const utc = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: "UTC" })

const monthDay = utc({ month: "short", day: "numeric" })
const weekday = utc({ weekday: "short" })
const fullDay = utc({ weekday: "short", month: "short", day: "numeric" })
const shortMonth = utc({ month: "short" })
const longMonth = utc({ month: "long", year: "numeric" })

/** Up to this many daily points, ticks name the weekday. */
const WEEK_POINTS = 7

const localDate = (t: string) => new Date(`${t.slice(0, 10)}T00:00:00Z`)
const localTime = (t: string) => t.slice(11, 16)

type AxisScale = { interval: StatsInterval; points: number }

/**
 * "14:00" for hours, "Tue 6" within a week, "Oct 6" for longer runs of
 * days and for weeks (their Monday), "Oct" for months.
 */
export function tickLabel(t: string, { interval, points }: AxisScale): string {
  if (interval === "hour") return localTime(t)
  const date = localDate(t)
  if (interval === "month") return shortMonth.format(date)
  if (interval === "week" || points > WEEK_POINTS) {
    return monthDay.format(date)
  }
  // Built by hand: en-US puts the day first ("6 Tue").
  return `${weekday.format(date)} ${date.getUTCDate()}`
}

/** "Tue, Oct 6, 14:00", "Tue, Oct 6", "Week of Sep 28" or "October 2026". */
export function tooltipLabel(t: string, interval: StatsInterval): string {
  const date = localDate(t)
  switch (interval) {
    case "hour":
      return `${fullDay.format(date)}, ${localTime(t)}`
    case "day":
      return fullDay.format(date)
    case "week":
      return `Week of ${monthDay.format(date)}`
    case "month":
      return longMonth.format(date)
  }
}
