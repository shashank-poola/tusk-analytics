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

/**
 * Filters one request may combine. Each adds a subquery that reads the
 * range again and about 5 bound parameters; with 5, the heaviest query
 * (the visitors list) stays well under D1's 100 per statement.
 */
export const MAX_ACTIVE_FILTERS = 5

const filterValue = z.string().min(1).max(MAX_FILTER_VALUE_LENGTH).optional()

/**
 * `?country=IN&page=/pricing`: optional, at most one value per key and
 * MAX_ACTIVE_FILTERS keys.
 */
export const statsFiltersSchema = z
  .object(
    Object.fromEntries(STATS_FILTER_KEYS.map((key) => [key, filterValue])) as {
      [Key in StatsFilterKey]: typeof filterValue
    }
  )
  .refine(
    (filters) =>
      Object.values(filters).filter(Boolean).length <= MAX_ACTIVE_FILTERS,
    { message: `Combine at most ${MAX_ACTIVE_FILTERS} filters` }
  )
export type StatsFilters = z.infer<typeof statsFiltersSchema>
