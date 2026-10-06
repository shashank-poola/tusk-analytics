import {
  type BreakdownBy,
  STATS_FILTER_KEYS,
  type StatsBreakdownResponse,
  type StatsFilterKey,
  type StatsFilters,
} from "@workspace/contracts"

import { keyLabel } from "./labels"

type Row = StatsBreakdownResponse["rows"][number]

/** Filter names in chips, after the tab a filter comes from. */
export const FILTER_LABELS: Record<StatsFilterKey, string> = {
  channel: "Channel",
  source: "Referrer",
  campaign: "Campaign",
  hostname: "Hostname",
  page: "Page",
  entry_page: "Entry page",
  exit_link: "Exit link",
  country: "Country",
  region: "Region",
  city: "City",
  browser: "Browser",
  os: "OS",
  device: "Device",
}

/** The filter a breakdown dimension sets, or null when it can't filter. */
function filterKeyOf(by: BreakdownBy): StatsFilterKey | null {
  switch (by) {
    case "referrer":
    case "exit_page":
      return null
    default:
      return by
  }
}

/**
 * What clicking `row` adds to the filters: its value, plus its country for
 * a region or city (Paris, FR is not Paris, US). Null for rows without a
 * value ("Unknown") and dimensions that don't filter.
 */
export function rowFilters(by: BreakdownBy, row: Row): StatsFilters | null {
  const key = filterKeyOf(by)
  if (!key || !row.key) return null
  if ((by === "region" || by === "city") && row.country) {
    return { [key]: row.key, country: row.country }
  }
  return { [key]: row.key }
}

/** The active filters as chips: "Country: India". */
export function filterChips(
  filters: StatsFilters
): { key: StatsFilterKey; label: string; value: string }[] {
  return STATS_FILTER_KEYS.flatMap((key) => {
    const value = filters[key]
    if (!value) return []
    return [{ key, label: FILTER_LABELS[key], value: keyLabel(key, value) }]
  })
}
