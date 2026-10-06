import type { BreakdownBy, StatsRange } from "@workspace/contracts"

import { RANGE_PERIODS } from "./analytics-params"
import { getBreakdown, getOverview, getTimeseries } from "./analytics.queries"
import { BreakdownBody } from "./breakdown-card"
import { EmptyState } from "./empty-state"
import { formatNumber } from "./format"
import { Greeting } from "./greeting"
import { buildHighlights } from "./highlights"
import { HighlightsCard } from "./highlights-card"
import { KpiCards } from "./kpi-cards"
import { VisitorsChart } from "./visitors-chart"

// Each section fetches its own data inside its own Suspense boundary, so the
// requests run in parallel and stream in as they finish. Shared requests are
// deduped by `cache` in analytics.queries.ts.

type SectionProps = { siteId: string; range: StatsRange }

export async function GreetingSection({
  siteId,
  range,
  name,
  domain,
}: SectionProps & { name: string | null; domain: string }) {
  const overview = await getOverview(siteId, range)
  // Step 4B fills `visitorsNow` with the live pill.
  return (
    <Greeting name={name} domain={domain} range={range} overview={overview} />
  )
}

export async function KpiSection({ siteId, range }: SectionProps) {
  const [overview, timeseries] = await Promise.all([
    getOverview(siteId, range),
    getTimeseries(siteId, range),
  ])
  return <KpiCards overview={overview} timeseries={timeseries} />
}

export async function ChartSection({ siteId, range }: SectionProps) {
  const [timeseries, { current }] = await Promise.all([
    getTimeseries(siteId, range),
    getOverview(siteId, range),
  ])
  if (current.pageviews === 0) {
    return <EmptyState siteId={siteId} range={range} />
  }
  const period = RANGE_PERIODS[range]
  return (
    <VisitorsChart
      timeseries={timeseries}
      label={`Visitors and pageviews over ${period}`}
      summary={`In ${period}: ${formatNumber(current.visitors)} visitors and ${formatNumber(current.pageviews)} pageviews.`}
    />
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
  return (
    <BreakdownBody
      title={title}
      siteId={siteId}
      range={range}
      breakdown={breakdown}
    />
  )
}
