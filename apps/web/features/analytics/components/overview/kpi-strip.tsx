import {
  LIVE_WINDOW_MINUTES,
  type StatsOverviewResponse,
} from "@workspace/contracts"

import { CountUp, type CountUpFormat } from "./count-up"
import { DeltaChip } from "./delta-chip"
import {
  bounceRateChange,
  type Change,
  countChange,
} from "@/features/analytics/utils/format"
import { LIVE_POLL_INTERVAL_MS, LiveCount } from "./live-count"
import { MetricHint } from "./metric-hint"

// Definitions condensed from docs/metrics.md.
const HINTS = {
  visitors: "People who visited, each counted once however often they came.",
  pageviews: "Every page load, including moves between pages in an app.",
  bounceRate:
    "Share of visits that saw only one page. Lower is usually better.",
  sessionTime:
    "Average time from a visit's first to its last pageview. One-page visits count as 0.",
  online: `People with a pageview in the last ${LIVE_WINDOW_MINUTES} minutes. Updates every ${LIVE_POLL_INTERVAL_MS / 1000} seconds.`,
}

type Kpi = {
  label: string
  hint: string
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
 * The headline numbers in one row on top of the chart, each with its change
 * versus the previous period. With no visits in the range they show a dash,
 * not a misleading 0%.
 */
export function KpiStrip({
  siteId,
  overview: { current, previous },
  liveVisitors,
}: KpiStripProps) {
  const empty = current.pageviews === 0
  const kpis: Kpi[] = [
    {
      label: "Visitors",
      hint: HINTS.visitors,
      value: current.visitors,
      format: "count",
      change: countChange(current.visitors, previous.visitors),
    },
    {
      label: "Pageviews",
      hint: HINTS.pageviews,
      value: current.pageviews,
      format: "count",
      change: countChange(current.pageviews, previous.pageviews),
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
    {
      label: "Session time",
      hint: HINTS.sessionTime,
      value: current.avgSessionSeconds,
      format: "duration",
      change:
        previous.sessions === 0
          ? { direction: "none" }
          : countChange(current.avgSessionSeconds, previous.avgSessionSeconds),
    },
  ]

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <KpiItem key={kpi.label} label={kpi.label} hint={kpi.hint}>
          <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.75rem]">
            {empty ? (
              <Dash />
            ) : (
              <CountUp value={kpi.value} format={kpi.format} />
            )}
          </p>
          {empty ? (
            <span className="h-6" />
          ) : (
            <DeltaChip change={kpi.change} lowerIsBetter={kpi.lowerIsBetter} />
          )}
        </KpiItem>
      ))}
      <KpiItem
        label="Online"
        hint={HINTS.online}
        badge={
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-live" />
          </span>
        }
      >
        <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.75rem]">
          <LiveCount siteId={siteId} initialCount={liveVisitors} />
        </p>
        <span className="h-6" />
      </KpiItem>
    </ul>
  )
}

type KpiItemProps = {
  label: string
  hint: string
  badge?: React.ReactNode
  children: React.ReactNode
}

function KpiItem({ label, hint, badge, children }: KpiItemProps) {
  return (
    <li
      // Hairlines between items on one row, like table columns.
      className="relative flex flex-col gap-1.5 border-border px-4 py-4 sm:px-5 lg:border-r lg:last:border-r-0"
    >
      <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <MetricHint label={label} hint={hint} />
        {badge}
      </h3>
      {children}
    </li>
  )
}

function Dash() {
  return (
    <>
      <span aria-hidden="true" className="text-muted-foreground">
        –
      </span>
      <span className="sr-only">No data</span>
    </>
  )
}
