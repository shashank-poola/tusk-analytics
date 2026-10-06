import {
  type BreakdownBy,
  type StatsRange,
  statsRangeSchema,
} from "@workspace/contracts"

export const DEFAULT_RANGE: StatsRange = "7d"

export const RANGES = statsRangeSchema.options

/** For sentences: "in the last 7 days". */
export const RANGE_PERIODS: Record<StatsRange, string> = {
  "24h": "the last 24 hours",
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  "90d": "the last 90 days",
}

/** For the range menu: "Last 7 days". */
export const RANGE_LABELS: Record<StatsRange, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
}

type Tab = { by: BreakdownBy; label: string }

/**
 * The four breakdown cards. Each keeps its open tab in its own search param
 * (`?sources=referrer`), so every view is shareable and server-rendered.
 * The first tab is the default.
 */
export const BREAKDOWN_CARDS = {
  sources: [
    { by: "source", label: "Source" },
    { by: "channel", label: "Channel" },
    { by: "referrer", label: "Referrer" },
    { by: "campaign", label: "Campaign" },
  ],
  pages: [
    { by: "page", label: "Page" },
    { by: "entry_page", label: "Entry page" },
    { by: "exit_page", label: "Exit page" },
  ],
  locations: [
    { by: "country", label: "Country" },
    { by: "region", label: "Region" },
    { by: "city", label: "City" },
  ],
  devices: [
    { by: "browser", label: "Browser" },
    { by: "os", label: "OS" },
    { by: "device", label: "Device" },
  ],
} as const satisfies Record<string, readonly [Tab, ...Tab[]]>

export type BreakdownCardKey = keyof typeof BREAKDOWN_CARDS
export const BREAKDOWN_CARD_KEYS = [
  "sources",
  "pages",
  "locations",
  "devices",
] as const satisfies readonly BreakdownCardKey[]

/** The open tab of each card, as kept in the URL. */
export type BreakdownTabs = Record<BreakdownCardKey, BreakdownBy>

type SearchParamValue = string | string[] | undefined
type SearchParams = Record<string, SearchParamValue>

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** `?range=`, or the default when it's missing or unknown. */
export function parseRange(value: SearchParamValue): StatsRange {
  const result = statsRangeSchema.safeParse(first(value))
  return result.success ? result.data : DEFAULT_RANGE
}

function pickTab(
  tabs: readonly [Tab, ...Tab[]],
  value: SearchParamValue
): BreakdownBy {
  const wanted = first(value)
  return tabs.find(({ by }) => by === wanted)?.by ?? tabs[0].by
}

/** Each card's tab from its param; the card's first tab when missing or unknown. */
export function parseBreakdownTabs(search: SearchParams): BreakdownTabs {
  return {
    sources: pickTab(BREAKDOWN_CARDS.sources, search.sources),
    pages: pickTab(BREAKDOWN_CARDS.pages, search.pages),
    locations: pickTab(BREAKDOWN_CARDS.locations, search.locations),
    devices: pickTab(BREAKDOWN_CARDS.devices, search.devices),
  }
}
