import { defaultInterval, type StatsPeriod } from "@workspace/contracts"

import {
  getOverview,
  getTimeseries,
} from "@/features/analytics/server/analytics.queries"
import { formatNumber } from "@/features/analytics/utils/format"
import { sparklinePath } from "@/features/analytics/utils/sparkline"

const WIDTH = 300
const HEIGHT = 64

type SiteSparklineProps = { siteId: string; period: StatsPeriod }

/**
 * A site card's body on /sites, as DataFast's: visitors over the period as
 * one smooth line, no axes, and the visitor count under it.
 */
export async function SiteSparkline({ siteId, period }: SiteSparklineProps) {
  const scope = { period, filters: {} }
  const [timeseries, { current }] = await Promise.all([
    getTimeseries(siteId, scope, defaultInterval(period)),
    getOverview(siteId, scope),
  ])
  const path = sparklinePath(
    timeseries.points.map((point) => point.visitors),
    WIDTH,
    HEIGHT
  )
  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="h-16 w-full overflow-visible"
      >
        <path
          d={path}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {formatNumber(current.visitors)}
        </span>{" "}
        {current.visitors === 1 ? "visitor" : "visitors"}
      </p>
    </div>
  )
}

/** The same body's shape while it loads. */
export function SiteSparklineSkeleton() {
  return (
    <div role="status" className="space-y-2">
      <span aria-hidden="true" className="block h-16 rounded-md bg-muted/60" />
      <span aria-hidden="true" className="block h-4 w-20 rounded-md bg-muted" />
      <span className="sr-only">Loading visitors…</span>
    </div>
  )
}
