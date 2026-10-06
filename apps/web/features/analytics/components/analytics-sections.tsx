import type { BreakdownBy, StatsRange } from "@workspace/contracts"

import { RANGE_PERIODS } from "@/features/analytics/utils/analytics-params"
import {
  getBreakdown,
  getLiveVisitors,
  getOverview,
  getRecentVisitors,
  getTimeseries,
} from "@/features/analytics/server/analytics.queries"
import { BreakdownBody } from "@/features/analytics/components/breakdowns/breakdown-card"
import { ChartEmptyState, NoData } from "./empty-state"
import { formatNumber } from "@/features/analytics/utils/format"
import { buildHighlights } from "@/features/analytics/utils/highlights"
import { HighlightsCard } from "@/features/analytics/components/summary/highlights-card"
import { KpiStrip } from "@/features/analytics/components/overview/kpi-strip"
import { VisitorsChart } from "@/features/analytics/components/overview/visitors-chart"
import { VisitorsList } from "@/features/analytics/components/visitors/visitors-card"

// Each section fetches its own data inside its own Suspense boundary, so the
// requests run in parallel and stream in as they finish. Shared requests are
// deduped by `cache` in analytics.queries.ts.

type SectionProps = { siteId: string; range: StatsRange }

export async function KpiSection({ siteId, range }: SectionProps) {
  const [overview, live] = await Promise.all([
    getOverview(siteId, range),
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
export async function ChartSection({ siteId, range }: SectionProps) {
  const [timeseries, { current }] = await Promise.all([
    getTimeseries(siteId, range),
    getOverview(siteId, range),
  ])
  const period = RANGE_PERIODS[range]
  return (
    <div className="relative">
      <VisitorsChart
        timeseries={timeseries}
        label={`Visitors and pageviews over ${period}`}
        summary={`In ${period}: ${formatNumber(current.visitors)} visitors and ${formatNumber(current.pageviews)} pageviews.`}
      />
      {current.pageviews === 0 && (
        <ChartEmptyState siteId={siteId} range={range} />
      )}
    </div>
  )
}

export async function HighlightsSection({ siteId, range }: SectionProps) {
  const [{ current, previous }, sources, pages] = await Promise.all([
    getOverview(siteId, range),
    getBreakdown(siteId, range, "source"),
    getBreakdown(siteId, range, "page"),
  ])
  const highlights = buildHighlights({
    range,
    current,
    previous,
    sources: sources.rows,
    pages: pages.rows,
  })
  return <HighlightsCard highlights={highlights} />
}

export async function BreakdownSection({
  siteId,
  range,
  by,
  title,
}: SectionProps & { by: BreakdownBy; title: string }) {
  const breakdown = await getBreakdown(siteId, range, by)
  return <BreakdownBody title={title} breakdown={breakdown} />
}

export async function VisitorsSection({ siteId, range }: SectionProps) {
  const { visitors } = await getRecentVisitors(siteId, range)
  if (visitors.length === 0) return <NoData label="No visitors yet" />
  return <VisitorsList visitors={visitors} now={new Date()} />
}
