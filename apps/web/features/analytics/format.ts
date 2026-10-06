import type { StatsInterval } from "@workspace/contracts"

// One locale for server and client render, so the markup always matches.
const LOCALE = "en-US"

const compact = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
})
const percent = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  maximumFractionDigits: 0,
})
const signedPercent = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
})
const signedPoints = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
})
const regionNames = new Intl.DisplayNames(LOCALE, { type: "region" })
const dayLabel = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})

/** 1234 → "1.2K". */
export function formatCompact(value: number): string {
  return compact.format(value)
}

/** 0.4567 → "46%". */
export function formatPercent(rate: number): string {
  return percent.format(rate)
}

export type Change =
  { direction: "none" } | { direction: "up" | "down" | "flat"; text: string }

function direction(delta: number): "up" | "down" | "flat" {
  if (delta > 0) return "up"
  if (delta < 0) return "down"
  return "flat"
}

/**
 * Relative change versus the previous period. `none` when the previous value
 * is 0, where a percentage means nothing.
 */
export function countChange(current: number, previous: number): Change {
  if (previous === 0) return { direction: "none" }
  const text = signedPercent.format((current - previous) / previous)
  return { direction: direction(current - previous), text }
}

/**
 * Bounce rate changes in percentage points (40% → 44% is +4 pts, not +10%).
 * `none` when the previous period had no sessions, so no bounce rate.
 */
export function bounceRateChange(
  current: number,
  previous: number,
  previousSessions: number
): Change {
  if (previousSessions === 0) return { direction: "none" }
  const points = Math.round((current - previous) * 1000) / 10
  const text = `${signedPoints.format(points)} pts`
  return { direction: direction(points), text }
}

/** "IN" → "India"; null or an unknown code → "Unknown" or the code itself. */
export function countryName(code: string | null): string {
  if (!code) return "Unknown"
  try {
    return regionNames.of(code) ?? code
  } catch {
    // Not a well-formed region code; show what was stored.
    return code
  }
}

/**
 * Axis label for a bucket. `t` carries the site's offset
 * (`2026-10-06T14:00:00.000+05:30`), so its date and time digits are already
 * local: read them directly instead of converting time zones.
 */
export function bucketLabel(t: string, interval: StatsInterval): string {
  if (interval === "hour") return t.slice(11, 16)
  return dayLabel.format(new Date(`${t.slice(0, 10)}T00:00:00Z`))
}
