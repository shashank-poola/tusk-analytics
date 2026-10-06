import {
  type BreakdownBy,
  breakdownBySchema,
  type StatsRange,
  statsRangeSchema,
} from "@workspace/contracts"

export const DEFAULT_RANGE: StatsRange = "7d"
export const DEFAULT_TAB: BreakdownBy = "source"

export const RANGE_LABELS: Record<StatsRange, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
}

type SearchParamValue = string | string[] | undefined

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** `?range=`, or the default when it's missing or unknown. */
export function parseRange(value: SearchParamValue): StatsRange {
  const result = statsRangeSchema.safeParse(first(value))
  return result.success ? result.data : DEFAULT_RANGE
}

/** `?tab=` names the breakdown dimension; the default when missing or unknown. */
export function parseTab(value: SearchParamValue): BreakdownBy {
  const result = breakdownBySchema.safeParse(first(value))
  return result.success ? result.data : DEFAULT_TAB
}
