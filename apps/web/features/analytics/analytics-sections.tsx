import type { BreakdownBy, StatsRange } from "@workspace/contracts"

import { RANGE_LABELS } from "./analytics-params"
import { getBreakdown, getOverview, getTimeseries } from "./analytics.queries"
import { BreakdownTable } from "./breakdown-table"
import { formatCompact } from "./format"
import { NoVisits } from "./no-visits"
import { StatCards } from "./stat-cards"
import { VisitorsChart } from "./visitors-chart"

// Each section fetches its own data inside its own Suspense boundary, so
// the requests run in parallel and stream in as they finish.

type SectionProps = { siteId: string; range: StatsRange }

export async function OverviewSection({ siteId, range }: SectionProps) {
  return <StatCards overview={await getOverview(siteId, range)} />
}

export async function ChartSection({ siteId, range }: SectionProps) {
  const [timeseries, { current }] = await Promise.all([
    getTimeseries(siteId, range),
    getOverview(siteId, range),
  ])
  if (current.pageviews === 0) return <NoVisits />

  const period = RANGE_LABELS[range].toLowerCase()
  return (
    <VisitorsChart
      timeseries={timeseries}
      label={`Visitors and pageviews, ${period}`}
      summary={`In the ${period}: ${formatCompact(current.visitors)} visitors and ${formatCompact(current.pageviews)} pageviews.`}
    />
  )
}

export async function BreakdownSection({
  siteId,
  range,
  by,
}: SectionProps & { by: BreakdownBy }) {
  return <BreakdownTable breakdown={await getBreakdown(siteId, range, by)} />
}
