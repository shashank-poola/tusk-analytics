import type {
  BreakdownBy,
  StatsInterval,
  StatsPeriod,
} from "@workspace/contracts"

import {
  getBreakdown,
  getLiveVisitors,
  getOverview,
  getRecentVisitors,
  getTimeseries,
} from "@/features/analytics/server/analytics.queries"
import { BreakdownBody } from "@/features/analytics/components/breakdowns/breakdown-card"
import { NoData } from "./empty-state"
import { formatNumber } from "@/features/analytics/utils/format"
import { buildHighlights } from "@/features/analytics/utils/highlights"
import { HighlightsCard } from "@/features/analytics/components/summary/highlights-card"
import { KpiStrip } from "@/features/analytics/components/overview/kpi-strip"
import { VisitorsChart } from "@/features/analytics/components/overview/visitors-chart"
import { VisitorsList } from "@/features/analytics/components/visitors/visitors-card"

// Each section fetches its own data inside its own Suspense boundary, so the
// requests run in parallel and stream in as they finish. Shared requests are
// deduped by `cache` in analytics.queries.ts.

type SectionProps = { siteId: string; period: StatsPeriod }

export async function KpiSection({ siteId, period }: SectionProps) {
  const [overview, live] = await Promise.all([
    getOverview(siteId, period),
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
  period,
  interval,
  label,
  emptyState,
}: SectionProps & {
  interval: StatsInterval
  /** The period in words, e.g. "Last 7 days". */
  label: string
  /** Laid over the flat chart when the period has no visits. */
  emptyState: React.ReactNode
}) {
  const [timeseries, { current }] = await Promise.all([
    getTimeseries(siteId, period, interval),
    getOverview(siteId, period),
  ])
  return (
    <div className="relative">
      <VisitorsChart
        timeseries={timeseries}
        label={`Visitors and pageviews, ${label}`}
        summary={`${label}: ${formatNumber(current.visitors)} visitors and ${formatNumber(current.pageviews)} pageviews.`}
      />
      {current.pageviews === 0 && emptyState}
    </div>
  )
}

export async function HighlightsSection({ siteId, period }: SectionProps) {
  const [{ current, previous }, sources, pages] = await Promise.all([
    getOverview(siteId, period),
    getBreakdown(siteId, period, "source"),
    getBreakdown(siteId, period, "page"),
  ])
  const highlights = buildHighlights({
    current,
    previous,
    sources: sources.rows,
    pages: pages.rows,
  })
  return <HighlightsCard highlights={highlights} />
}

export async function BreakdownSection({
  siteId,
  period,
  by,
  title,
}: SectionProps & { by: BreakdownBy; title: string }) {
  const breakdown = await getBreakdown(siteId, period, by)
  return <BreakdownBody title={title} breakdown={breakdown} />
}

export async function VisitorsSection({ siteId, period }: SectionProps) {
  const { visitors } = await getRecentVisitors(siteId, period)
  if (visitors.length === 0) return <NoData label="No visitors yet" />
  return <VisitorsList visitors={visitors} now={new Date()} />
}
