import {
  allowedIntervals,
  defaultInterval,
  funnelIdSchema,
  MAX_ACTIVE_FILTERS,
  periodDays,
  type PresetRange,
  STATS_FILTER_KEYS,
  type StatsFilters,
  statsFiltersSchema,
  type StatsInterval,
  statsIntervalSchema,
  type StatsPeriod,
  statsPeriodSchema,
} from "@workspace/contracts"

import {
  BREAKDOWN_CARD_KEYS,
  BREAKDOWN_CARDS,
  type BreakdownTabs,
  parseBreakdownTabs,
} from "./breakdown-tabs"

// Everything the dashboard shows is chosen in the URL, so every view is
// shareable and server-rendered: the period (`range`, `offset` or
// `from`/`to`), the chart's `interval`, each card's open tab and the
// filters (`?country=IN`).

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

/** The bottom card's tabs (`?insights=`); DataFast's Journey waits for revenue. */
export const INSIGHT_TABS = [
  { id: "goal", label: "Goal" },
  { id: "funnel", label: "Funnel" },
  { id: "user", label: "User" },
] as const
export type InsightTab = (typeof INSIGHT_TABS)[number]["id"]
/** Users work without any setup; goals and funnels need some. */
const DEFAULT_INSIGHT_TAB: InsightTab = "user"

/** What the page shows, parsed from its search params. */
export type DashboardView = {
  period: StatsPeriod
  interval: StatsInterval
  tabs: BreakdownTabs
  filters: StatsFilters
  insights: InsightTab
  /** The funnel the Funnel tab shows (`?funnel=`); its first when null. */
  funnel: string | null
  /** Draw the previous period on the chart too (`?compare=1`). */
  compare: boolean
}

/** What every stats request is narrowed to. */
export type StatsScope = Pick<DashboardView, "period" | "filters">

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

/**
 * Each valid filter in the URL, at most MAX_ACTIVE_FILTERS; an invalid one
 * is dropped, not fatal.
 */
export function parseFilters(search: SearchParams): StatsFilters {
  const filters: StatsFilters = {}
  let count = 0
  for (const key of STATS_FILTER_KEYS) {
    const result = statsFiltersSchema.shape[key].safeParse(first(search[key]))
    if (!result.success || !result.data || count === MAX_ACTIVE_FILTERS) {
      continue
    }
    filters[key] = result.data
    count++
  }
  return filters
}

export function parseView(search: SearchParams): DashboardView {
  const period = parsePeriod(search)
  const insights = first(search.insights)
  const funnel = funnelIdSchema.safeParse(first(search.funnel))
  return {
    period,
    interval: parseInterval(search.interval, period),
    tabs: parseBreakdownTabs(search),
    filters: parseFilters(search),
    insights:
      INSIGHT_TABS.find((tab) => tab.id === insights)?.id ??
      DEFAULT_INSIGHT_TAB,
    funnel: funnel.success ? funnel.data : null,
    compare: first(search.compare) === "1",
  }
}

/**
 * The params the page shows: the URL's when it has any (a view too long for
 * the cookie stays in the URL), else the ones the proxy kept in the cookie.
 * Either way `parseView` validates them.
 */
export function viewParams(
  search: SearchParams,
  stored: string | undefined
): SearchParams {
  if (Object.keys(search).length > 0) return search
  return Object.fromEntries(new URLSearchParams(stored ?? ""))
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

/** The period and filters as API query params, in a stable order. */
export function scopeQuery({
  period,
  filters,
}: StatsScope): Record<string, string> {
  const query = periodQuery(period)
  for (const key of STATS_FILTER_KEYS) {
    const value = filters[key]
    if (value) query[key] = value
  }
  return query
}

/**
 * The search params of `view`, leaving out defaults so URLs stay short.
 * Moving to a period of another length resets the interval to that
 * period's default; stepping to the previous or next period keeps it.
 */
export function viewSearch(
  view: DashboardView,
  change: Partial<DashboardView> = {}
): Record<string, string> {
  const next = { ...view, ...change }
  const resized =
    change.period && periodDays(change.period) !== periodDays(view.period)
  const interval =
    resized && !change.interval ? defaultInterval(next.period) : next.interval
  const search = scopeQuery(next)
  if (interval !== defaultInterval(next.period)) search.interval = interval
  for (const card of BREAKDOWN_CARD_KEYS) {
    if (next.tabs[card] !== BREAKDOWN_CARDS[card].defaultTab) {
      search[card] = next.tabs[card]
    }
  }
  if (next.insights !== DEFAULT_INSIGHT_TAB) search.insights = next.insights
  if (next.funnel) search.funnel = next.funnel
  if (next.compare) search.compare = "1"
  return search
}

/** A stable string for section keys and caches: the same data, the same key. */
export function scopeKey(scope: StatsScope): string {
  return new URLSearchParams(scopeQuery(scope)).toString()
}
