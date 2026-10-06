import type { StatsPeriod } from "@workspace/contracts"

import { getOverview } from "@/features/analytics/server/analytics.queries"
import { formatNumber } from "@/features/analytics/utils/format"

type SitesVisitorTotalProps = { siteIds: string[]; period: StatsPeriod }

/**
 * Visitors across all of the user's sites in the period, for the greeting
 * on /sites. A visitor id belongs to one site, so the sum counts nobody
 * twice. The cards reuse these requests through `cache`.
 */
export async function SitesVisitorTotal({
  siteIds,
  period,
}: SitesVisitorTotalProps) {
  const overviews = await Promise.all(
    siteIds.map((siteId) => getOverview(siteId, { period, filters: {} }))
  )
  const total = overviews.reduce(
    (sum, { current }) => sum + current.visitors,
    0
  )
  return (
    <span className="font-semibold text-foreground tabular-nums">
      {formatNumber(total)}
    </span>
  )
}
