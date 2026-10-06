import type {
  StatsOverviewResponse,
  StatsTimeseriesResponse,
} from "@workspace/contracts"

import { Card } from "@/components/dashboard/card"

import { CountUp } from "./count-up"
import { DeltaChip } from "./delta-chip"
import { bounceRateChange, type Change, countChange } from "./format"
import { MetricHint } from "./metric-hint"
import { Sparkline } from "./sparkline"

// Definitions condensed from docs/metrics.md.
const HINTS = {
  visitors: "People who visited, each counted once however often they came.",
  pageviews: "Every page load, including moves between pages in an app.",
  sessions: "Visits. A visit ends after 30 minutes without a pageview.",
  bounceRate:
    "Share of visits that saw only one page. Lower is usually better.",
}

type Kpi = {
  label: string
  hint: string
  value: number
  format: "count" | "percent"
  change: Change
  lowerIsBetter?: boolean
  trend?: number[]
}

type KpiCardsProps = {
  overview: StatsOverviewResponse
  timeseries: StatsTimeseriesResponse
}

/** The four headline numbers, each with its change and a short definition. */
export function KpiCards({
  overview: { current, previous },
  timeseries: { points },
}: KpiCardsProps) {
  const kpis: Kpi[] = [
    {
      label: "Visitors",
      hint: HINTS.visitors,
      value: current.visitors,
      format: "count",
      change: countChange(current.visitors, previous.visitors),
      trend: points.map((point) => point.visitors),
    },
    {
      label: "Pageviews",
      hint: HINTS.pageviews,
      value: current.pageviews,
      format: "count",
      change: countChange(current.pageviews, previous.pageviews),
      trend: points.map((point) => point.pageviews),
    },
    {
      label: "Sessions",
      hint: HINTS.sessions,
      value: current.sessions,
      format: "count",
      change: countChange(current.sessions, previous.sessions),
    },
    {
      label: "Bounce rate",
      hint: HINTS.bounceRate,
      value: current.bounceRate,
      format: "percent",
      lowerIsBetter: true,
      change: bounceRateChange(
        current.bounceRate,
        previous.bounceRate,
        previous.sessions
      ),
    },
  ]

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <li key={kpi.label}>
          <KpiCard kpi={kpi} />
        </li>
      ))}
    </ul>
  )
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card className="relative flex h-full flex-col gap-3 p-4 sm:p-5">
      <h3 className="text-sm font-medium text-muted-foreground">
        <MetricHint label={kpi.label} hint={kpi.hint} />
      </h3>
      <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
        <CountUp value={kpi.value} format={kpi.format} />
      </p>
      <div className="mt-auto flex items-end justify-between gap-2">
        <DeltaChip change={kpi.change} lowerIsBetter={kpi.lowerIsBetter} />
        {kpi.trend?.some((value) => value > 0) && (
          <span className="hidden sm:block">
            <Sparkline values={kpi.trend} />
          </span>
        )}
      </div>
    </Card>
  )
}
