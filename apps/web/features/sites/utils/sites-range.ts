import type { StatsPeriod } from "@workspace/contracts"

/** The periods the /sites list offers, as DataFast's does. */
export const SITES_RANGES = ["24h", "7d", "30d"] as const
export type SitesRange = (typeof SITES_RANGES)[number]

export const DEFAULT_SITES_RANGE: SitesRange = "24h"

export const SITES_RANGE_LABELS: Record<SitesRange, string> = {
  "24h": "last 24 hours",
  "7d": "last 7 days",
  "30d": "last 30 days",
}

/** The stored range, or the default when it's missing or unknown. */
export function parseSitesRange(value: string | undefined): SitesRange {
  return SITES_RANGES.find((range) => range === value) ?? DEFAULT_SITES_RANGE
}

export function sitesPeriod(range: SitesRange): StatsPeriod {
  return { range, offset: 0 }
}
