import { type SQL, sql } from "drizzle-orm"

import { events } from "../schema"

export type TimeseriesInterval = "minute" | "hour" | "day" | "week" | "month"

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS
/** Day 0 of the Unix epoch was a Thursday; weeks start on Monday. */
const MONDAY_SHIFT_MS = 3 * DAY_MS

/**
 * The local start (unix ms + offsetMs) of the bucket a pageview falls in.
 * Matches `bucketStarts` in packages/contracts/src/stats-period.ts. CASTs
 * because D1 may bind the numbers as REAL, which would make `/` a float
 * division.
 */
export function bucketOf(
  interval: TimeseriesInterval,
  offsetMs: number,
  at: SQL = sql`${events.createdAt}`
): SQL {
  const local = sql`(${at} + ${offsetMs})`
  switch (interval) {
    case "minute":
    case "hour":
    case "day": {
      const size = { minute: MINUTE_MS, hour: HOUR_MS, day: DAY_MS }[interval]
      return sql`CAST(${local} / ${size} AS INTEGER) * ${size}`
    }
    case "week":
      return sql`CAST((${local} + ${MONDAY_SHIFT_MS}) / ${WEEK_MS} AS INTEGER) * ${WEEK_MS} - ${MONDAY_SHIFT_MS}`
    case "month":
      return sql`CAST(strftime('%s', CAST(${local} / 1000 AS INTEGER), 'unixepoch', 'start of month') AS INTEGER) * 1000`
  }
}
