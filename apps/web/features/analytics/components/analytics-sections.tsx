import {
  BREAKDOWN_MAX_LIMIT,
  type StatsBreakdownResponse,
  type StatsInterval,
} from "@workspace/contracts"

import { routes } from "@/lib/routes"

import {
  getBreakdown,
  getLiveVisitors,
  getOverview,
  getTimeseries,
} from "@/features/analytics/server/analytics.queries"
import {
  type DashboardView,
  type StatsScope,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import {
  type BreakdownCardKey,
  cardTab,
} from "@/features/analytics/utils/breakdown-tabs"
import { rowFilters, withRowFilters } from "@/features/analytics/utils/filters"
import { formatNumber } from "@/features/analytics/utils/format"
import { keyLabel } from "@/features/analytics/utils/labels"
import { BreakdownBody } from "./breakdowns/breakdown-body"
import { BreakdownDialog } from "./breakdowns/breakdown-dialog"
import { BreakdownTable } from "./breakdowns/breakdown-table"
import { ChannelDonut } from "./breakdowns/channel-donut"
import { NoData } from "./empty-state"
import { WorldMap } from "./locations/world-map"
import { KpiStrip } from "./overview/kpi-strip"
import { VisitorsChart } from "./overview/visitors-chart"

// Each section fetches its own data inside its own Suspense boundary, so the
// requests run in parallel and stream in as they finish. Shared requests are
// deduped by `cache` in analytics.queries.ts.

type SectionProps = { siteId: string; scope: StatsScope }

export async function KpiSection({ siteId, scope }: SectionProps) {
  const [overview, live] = await Promise.all([
    getOverview(siteId, scope),
    getLiveVisitors(siteId),
  ])
  return (
    <KpiStrip
      siteId={siteId}
      overview={overview}
      liveVisitors={live.visitors}
    />
  )
}

/** Always draws the chart, flat when empty, so the card never changes size. */
export async function ChartSection({
  siteId,
  scope,
  interval,
  compare,
  label,
  emptyState,
}: SectionProps & {
  interval: StatsInterval
  /** Draw the previous period too. */
  compare: boolean
  /** The period in words, e.g. "Last 7 days". */
  label: string
  /** Laid over the flat chart when the period has no visits. */
  emptyState: React.ReactNode
}) {
  const [timeseries, { current }] = await Promise.all([
    getTimeseries(siteId, scope, interval),
    getOverview(siteId, scope),
  ])
  return (
    <div className="relative">
      <VisitorsChart
        timeseries={timeseries}
        compare={compare}
        label={`Visitors, ${label}`}
        summary={`${label}: ${formatNumber(current.visitors)} visitors and ${formatNumber(current.pageviews)} pageviews.`}
      />
      {current.pageviews === 0 && emptyState}
    </div>
  )
}

type Row = StatsBreakdownResponse["rows"][number]

/** A card's open tab: rows, the channel donut or the world map. */
export async function BreakdownSection({
  siteId,
  view,
  card,
}: {
  siteId: string
  view: DashboardView
  card: BreakdownCardKey
}) {
  const tab = cardTab(card, view.tabs[card])
  const breakdown = await getBreakdown(
    siteId,
    view,
    tab.by,
    tab.chart === "map" ? BREAKDOWN_MAX_LIMIT : undefined
  )
  const hrefFor = (row: Row) => {
    const filters = withRowFilters(view.filters, rowFilters(tab.by, row))
    return filters && routes.site(siteId, viewSearch(view, { filters }))
  }
  if (breakdown.rows.length === 0) return <NoData />
  // Charts get the same Details list as the rows, under the chart.
  const details = (title: string) => (
    <div className="flex justify-center pt-1">
      <BreakdownDialog title={title} count={breakdown.rows.length}>
        <BreakdownTable title={title} breakdown={breakdown} hrefFor={hrefFor} />
      </BreakdownDialog>
    </div>
  )
  switch (tab.chart) {
    case "map":
      return (
        <>
          <div className="min-h-0 flex-1">
            <WorldMap rows={breakdown.rows} hrefFor={hrefFor} />
          </div>
          {details("Country")}
        </>
      )
    case "donut":
      return (
        <>
          <ChannelDonut
            slices={breakdown.rows.flatMap((row) => {
              const href = hrefFor(row)
              if (!href) return []
              return [
                {
                  label: keyLabel("channel", row.key),
                  visitors: row.visitors,
                  topSources: row.topSources ?? [],
                  href,
                },
              ]
            })}
          />
          {details(tab.label)}
        </>
      )
    case undefined:
      return (
        <BreakdownBody
          title={tab.label}
          breakdown={breakdown}
          hrefFor={hrefFor}
        />
      )
  }
}
