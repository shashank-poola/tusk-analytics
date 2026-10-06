// Number and change formatting for every analytics component.

// One locale for server and client render, so the markup always matches.
export const LOCALE = "en-US"

const compact = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
})
const whole = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const percent = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  maximumFractionDigits: 0,
})

/** 1234 → "1.2K". */
export function formatCompact(value: number): string {
  return compact.format(value)
}

/** 1234 → "1,234". For sentences, where precision reads friendlier. */
export function formatNumber(value: number): string {
  return whole.format(value)
}

/** 0.4567 → "46%". */
export function formatPercent(rate: number): string {
  return percent.format(rate)
}

/** 116 → "1m 56s", 42 → "42s", 3725 → "1h 2m". Whole seconds. */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds)
  if (total < 60) return `${total}s`
  const minutes = Math.floor(total / 60)
  if (minutes < 60) return `${minutes}m ${total % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

const relativeTime = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" })

/** "just now", "5 minutes ago", "yesterday", "3 days ago". */
export function formatTimeAgo(iso: string, now: Date): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  if (seconds > -45) return "just now"
  const minutes = Math.round(seconds / 60)
  if (minutes > -60) return relativeTime.format(minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (hours > -24) return relativeTime.format(hours, "hour")
  return relativeTime.format(Math.round(hours / 24), "day")
}

export type Change =
  { direction: "none" } | { direction: "up" | "down" | "flat"; text: string }

function direction(delta: number): "up" | "down" | "flat" {
  if (delta > 0) return "up"
  if (delta < 0) return "down"
  return "flat"
}

/** (current - previous) / previous, or null when there's no previous value. */
export function relativeChange(
  current: number,
  previous: number
): number | null {
  return previous === 0 ? null : (current - previous) / previous
}

/**
 * "20%" and its direction versus the previous period: the arrow carries the
 * sign, as on DataFast. `none` when the previous value is 0.
 */
export function countChange(current: number, previous: number): Change {
  const change = relativeChange(current, previous)
  if (change === null) return { direction: "none" }
  return {
    direction: direction(change),
    text: percent.format(Math.abs(change)),
  }
}
