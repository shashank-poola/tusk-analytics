import {
  getLiveVisitors,
  getOverview,
} from "@/features/analytics/server/analytics.queries"
import type { StatsScope } from "@/features/analytics/utils/analytics-params"
import { formatCompact, formatNumber } from "@/features/analytics/utils/format"

const LAST_7_DAYS: StatsScope = {
  period: { range: "7d", offset: 0 },
  filters: {},
}

/**
 * A site card's numbers, where a profile shows followers: visitors and
 * pageviews over the last 7 days, and who is on the site now.
 */
export async function SiteCardStats({ siteId }: { siteId: string }) {
  const [{ current }, live] = await Promise.all([
    getOverview(siteId, LAST_7_DAYS),
    getLiveVisitors(siteId),
  ])
  return (
    <div className="space-y-1">
      <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Stat value={current.visitors} label="Visitors" />
        <Stat value={current.pageviews} label="Pageviews" />
        <div className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={
              live.visitors > 0
                ? "size-2 rounded-full bg-live"
                : "size-2 rounded-full bg-muted-foreground/40"
            }
          />
          <dt className="sr-only">Online now</dt>
          <dd>
            <span className="font-semibold tabular-nums">
              {formatNumber(live.visitors)}
            </span>{" "}
            <span className="text-muted-foreground">online</span>
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">Last 7 days</p>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  // Term first in the markup, number first on screen: "1.2K Visitors".
  return (
    <div className="inline-flex items-baseline gap-1">
      <dt className="order-2 text-muted-foreground">{label}</dt>
      <dd
        className="order-1 font-semibold tabular-nums"
        title={formatNumber(value)}
      >
        {formatCompact(value)}
      </dd>
    </div>
  )
}

/** The same row's shape while the numbers load. */
export function SiteCardStatsSkeleton() {
  return (
    <div role="status" className="space-y-1.5">
      <span aria-hidden="true" className="block h-5 w-56 rounded-md bg-muted" />
      <span aria-hidden="true" className="block h-3 w-16 rounded-md bg-muted" />
      <span className="sr-only">Loading the numbers…</span>
    </div>
  )
}
