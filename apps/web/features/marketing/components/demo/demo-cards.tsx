import { Card } from "@/components/ui/card"

import { cn } from "@workspace/ui/lib/utils"

import { BreakdownBody } from "@/features/analytics/components/breakdowns/breakdown-body"
import { BreakdownRows } from "@/features/analytics/components/breakdowns/breakdown-rows"
import { UsersTable } from "@/features/analytics/components/insights/users-table"
import { ChangeIndicator } from "@/features/analytics/components/overview/change-indicator"
import { CountUp } from "@/features/analytics/components/overview/count-up"
import {
  KpiItem,
  LiveDot,
} from "@/features/analytics/components/overview/kpi-strip"
import { WorldMap } from "@/features/analytics/components/locations/world-map"
import { VisitorsChart } from "@/features/analytics/components/overview/visitors-chart"
import {
  TAB_TRACK_CLASSES,
  tabClasses,
} from "@/features/analytics/components/tab-pills"
import {
  type Change,
  countChange,
  formatNumber,
} from "@/features/analytics/utils/format"
import {
  DEMO_BREAKDOWNS,
  DEMO_CARDS,
  DEMO_NOW,
  DEMO_TIMESERIES,
  DEMO_TOTALS,
  DEMO_VISITORS,
} from "@/features/marketing/utils/demo-data"
import { DemoBreakdownCard } from "./demo-breakdown-card"

// The dashboard's own cards with sample data, for the hero demo and the
// feature rows. Nothing here reaches the API.

const { current, previous, online } = DEMO_TOTALS

type Kpi = {
  label: string
  value: React.ReactNode
  change: Change
  lowerIsBetter?: boolean
}

const KPIS: Record<"visitors" | "pageviews" | "bounce" | "session", Kpi> = {
  visitors: {
    label: "Visitors",
    value: <CountUp value={current.visitors} format="count" />,
    change: countChange(current.visitors, previous.visitors),
  },
  pageviews: {
    label: "Pageviews",
    value: <CountUp value={current.pageviews} format="count" />,
    change: countChange(current.pageviews, previous.pageviews),
  },
  bounce: {
    label: "Bounce rate",
    value: <CountUp value={current.bounceRate} format="percent" />,
    change: countChange(current.bounceRate, previous.bounceRate),
    lowerIsBetter: true,
  },
  session: {
    label: "Session time",
    value: <CountUp value={current.avgSessionSeconds} format="duration" />,
    change: countChange(current.avgSessionSeconds, previous.avgSessionSeconds),
  },
}

type DemoOverviewCardProps = {
  /** `live`: Visitors, Pageviews and Online only, for a narrow column. */
  variant?: "full" | "live"
  className?: string
}

/** The numbers row on top of the visitors chart. */
export function DemoOverviewCard({
  variant = "full",
  className,
}: DemoOverviewCardProps) {
  const kpis =
    variant === "full"
      ? [KPIS.visitors, KPIS.pageviews, KPIS.bounce, KPIS.session]
      : [KPIS.visitors, KPIS.pageviews]
  return (
    <Card
      aria-label="Overview"
      className={cn("flex flex-col overflow-hidden", className)}
    >
      <ul
        className={
          variant === "full"
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            : "grid grid-cols-3"
        }
      >
        {kpis.map((kpi) => (
          <KpiItem
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
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
          badge={<LiveDot />}
          value={formatNumber(online)}
        />
      </ul>
      <div className="mt-auto px-3 pb-3 sm:px-5 sm:pb-4">
        <VisitorsChart
          timeseries={DEMO_TIMESERIES}
          compare={false}
          // Short in the feature row, so it matches the cards beside it.
          heightClassName={variant === "live" ? "h-48" : undefined}
          label="Visitors, last 30 days"
          summary={`${formatNumber(current.visitors)} visitors and ${formatNumber(current.pageviews)} pageviews in the last 30 days.`}
        />
      </div>
    </Card>
  )
}

// Rows in the demo aren't filters: there's no dashboard to filter.
const noFilter = () => null

type DemoBreakdownProps = {
  /** Which of the dashboard's four cards: "Sources", "Pages"… */
  card: (typeof DEMO_CARDS)[number]["label"]
  /** A feature row's card: fewer rows, no "Details", its height from `className`. */
  compact?: boolean
  className?: string
}

const COMPACT_ROWS = 7

/** One breakdown card, its tabs switching in place. */
export function DemoBreakdown({
  card,
  compact = false,
  className,
}: DemoBreakdownProps) {
  const spec = DEMO_CARDS.find((candidate) => candidate.label === card)
  if (!spec) return null
  return (
    <DemoBreakdownCard
      label={spec.label}
      tabs={spec.tabs}
      compact={compact}
      className={className}
      panels={Object.fromEntries(
        spec.tabs.map((tab) => {
          const breakdown = DEMO_BREAKDOWNS[tab.id]
          return [
            tab.id,
            tab.id === "map" ? (
              <div key={tab.id} className="min-h-0 flex-1">
                <WorldMap rows={breakdown.rows} hrefFor={noFilter} />
              </div>
            ) : compact ? (
              <BreakdownRows
                key={tab.id}
                label={`Top ${tab.label.toLowerCase()}`}
                breakdown={{
                  ...breakdown,
                  rows: breakdown.rows.slice(0, COMPACT_ROWS),
                }}
                hrefFor={noFilter}
              />
            ) : (
              <BreakdownBody
                key={tab.id}
                title={tab.label}
                breakdown={breakdown}
                hrefFor={noFilter}
              />
            ),
          ]
        })
      )}
    />
  )
}

/** The User tab: faces, names, where they're from and when they were here. */
export function DemoUsersCard({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  return (
    <Card
      aria-label="Users"
      className={cn("relative flex flex-col p-2.5", className)}
    >
      <div className="flex min-h-11 items-center pr-1.5">
        <div className={TAB_TRACK_CLASSES}>
          <span className={tabClasses(true)}>User</span>
        </div>
      </div>
      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <UsersTable visitors={DEMO_VISITORS.slice(0, count)} now={DEMO_NOW} />
      </div>
    </Card>
  )
}
