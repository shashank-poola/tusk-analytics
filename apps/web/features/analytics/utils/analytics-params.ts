import {
  allowedIntervals,
  type BreakdownBy,
  defaultInterval,
  type PresetRange,
  type StatsInterval,
  statsIntervalSchema,
  type StatsPeriod,
  statsPeriodSchema,
} from "@workspace/contracts"

// Everything the dashboard shows is chosen in the URL, so every view is
// shareable and server-rendered: the period (`range`, `offset` or
// `from`/`to`), the chart's `interval` and each card's open tab.

export const DEFAULT_PERIOD: StatsPeriod = { range: "7d", offset: 0 }

/** For the period menu and the toolbar: "Last 7 days". */
export const PRESET_LABELS: Record<PresetRange, string> = {
  today: "Today",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12mo": "Last 12 months",
}

export const INTERVAL_LABELS: Record<StatsInterval, string> = {
  hour: "Hourly",
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
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

/** What the page shows, parsed from its search params. */
export type DashboardView = {
  period: StatsPeriod
  interval: StatsInterval
  tabs: BreakdownTabs
}

type SearchParamValue = string | string[] | undefined
type SearchParams = Record<string, SearchParamValue>

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** The period in the URL, or the default when it's missing or invalid. */
export function parsePeriod(search: SearchParams): StatsPeriod {
  const result = statsPeriodSchema.safeParse({
    range: first(search.range),
    offset: first(search.offset),
    from: first(search.from),
    to: first(search.to),
  })
  return result.success ? result.data : DEFAULT_PERIOD
}

/** `?interval=` when the period allows it, else the period's default. */
export function parseInterval(
  value: SearchParamValue,
  period: StatsPeriod
): StatsInterval {
  const result = statsIntervalSchema.safeParse(first(value))
  return result.success && allowedIntervals(period).includes(result.data)
    ? result.data
    : defaultInterval(period)
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

export function parseView(search: SearchParams): DashboardView {
  const period = parsePeriod(search)
  return {
    period,
    interval: parseInterval(search.interval, period),
    tabs: parseBreakdownTabs(search),
  }
}

/** The period as API query params. */
export function periodQuery(period: StatsPeriod): Record<string, string> {
  if (period.range === "custom") {
    return { range: "custom", from: period.from, to: period.to }
  }
  return period.offset === 0
    ? { range: period.range }
    : { range: period.range, offset: String(period.offset) }
}

/**
 * The search params of `view`, leaving out defaults so URLs stay short. A
 * change of period without an interval resets the interval to the new
 * period's default.
 */
export function viewSearch(
  view: DashboardView,
  change: Partial<DashboardView> = {}
): Record<string, string> {
  const next = { ...view, ...change }
  const interval =
    change.period && !change.interval
      ? defaultInterval(next.period)
      : next.interval
  const search = periodQuery(next.period)
  if (interval !== defaultInterval(next.period)) search.interval = interval
  for (const card of BREAKDOWN_CARD_KEYS) {
    if (next.tabs[card] !== BREAKDOWN_CARDS[card][0].by) {
      search[card] = next.tabs[card]
    }
  }
  return search
}

/** A stable string for keys and caches: the same view, the same key. */
export function periodKey(period: StatsPeriod): string {
  return new URLSearchParams(periodQuery(period)).toString()
}
