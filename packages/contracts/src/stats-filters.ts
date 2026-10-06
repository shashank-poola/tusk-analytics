import * as z from "zod"

// Filters narrow every stats request to the sessions that match all of
// them: docs/metrics.md#filters.

/** What a dashboard row can filter by; each is also a URL search param. */
export const STATS_FILTER_KEYS = [
  "channel",
  "source",
  "campaign",
  "hostname",
  "page",
  "entry_page",
  "exit_link",
  "country",
  "region",
  "city",
  "browser",
  "os",
  "device",
] as const
export type StatsFilterKey = (typeof STATS_FILTER_KEYS)[number]

/** Longer than any stored value (paths are capped at 1024). */
export const MAX_FILTER_VALUE_LENGTH = 1024

const filterValue = z.string().min(1).max(MAX_FILTER_VALUE_LENGTH).optional()

/** `?country=IN&page=/pricing`: optional, at most one value per key. */
export const statsFiltersSchema = z.object({
  channel: filterValue,
  source: filterValue,
  campaign: filterValue,
  hostname: filterValue,
  page: filterValue,
  entry_page: filterValue,
  exit_link: filterValue,
  country: filterValue,
  region: filterValue,
  city: filterValue,
  browser: filterValue,
  os: filterValue,
  device: filterValue,
} satisfies Record<StatsFilterKey, typeof filterValue>)
export type StatsFilters = z.infer<typeof statsFiltersSchema>
