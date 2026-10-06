import type { StatsOverviewResponse } from "@workspace/contracts"

import { ChangeIndicator } from "./change-indicator"
import { CountUp, type CountUpFormat } from "./count-up"
import { type Change, countChange } from "@/features/analytics/utils/format"
import { LiveCount } from "./live-count"

type Kpi = {
  label: string
  value: number
  format: CountUpFormat
  change: Change
  lowerIsBetter?: boolean
}

type KpiStripProps = {
  siteId: string
  overview: StatsOverviewResponse
  liveVisitors: number
}

/**
 * DataFast's numbers row on top of the chart: a label, the number, and its
 * change versus the previous period ("38% ↑") under it. Definitions:
 * docs/metrics.md.
 */
export function KpiStrip({
  siteId,
  overview: { current, previous },
  liveVisitors,
}: KpiStripProps) {
  const kpis: Kpi[] = [
    {
      label: "Visitors",
      value: current.visitors,
      format: "count",
      change: countChange(current.visitors, previous.visitors),
    },
    {
      label: "Pageviews",
      value: current.pageviews,
      format: "count",
      change: countChange(current.pageviews, previous.pageviews),
    },
    {
      label: "Bounce rate",
      value: current.bounceRate,
      format: "percent",
      lowerIsBetter: true,
      change: countChange(current.bounceRate, previous.bounceRate),
    },
    {
      label: "Session time",
      value: current.avgSessionSeconds,
      format: "duration",
      change: countChange(
        current.avgSessionSeconds,
        previous.avgSessionSeconds
      ),
    },
  ]

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <KpiItem
          key={kpi.label}
          label={kpi.label}
          value={<CountUp value={kpi.value} format={kpi.format} />}
          change={
            <ChangeIndicator
              change={kpi.change}
              lowerIsBetter={kpi.lowerIsBetter}
            />
          }
        />
      ))}
      <KpiItem
        label="Online"
        badge={
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-live" />
          </span>
        }
        value={<LiveCount siteId={siteId} initialCount={liveVisitors} />}
      />
    </ul>
  )
}

type KpiItemProps = {
  label: string
  badge?: React.ReactNode
  value: React.ReactNode
  /** Change versus the previous period; Online has none. */
  change?: React.ReactNode
}

function KpiItem({ label, badge, value, change }: KpiItemProps) {
  return (
    <li
      // Hairlines between items on one row, like table columns.
      className="flex flex-col border-border px-4 py-4 sm:px-5 lg:my-4 lg:border-r lg:py-0 lg:last:border-r-0"
    >
      <h3 className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {label}
        {badge}
      </h3>
      <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-[1.75rem]">
        {value}
      </p>
      <span className="mt-0.5 flex h-4 items-center">{change}</span>
    </li>
  )
}
