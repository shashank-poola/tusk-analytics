import type { InstallStatus, Site } from "@workspace/contracts"

import { Card, FIXED_CARD_HEIGHT } from "@/components/ui/card"

import {
  BreakdownSkeleton,
  ChartSkeleton,
  KpiStripSkeleton,
} from "@/features/analytics/components/skeletons"
import { FirstVisitWatch } from "./first-visit-watch"

type WaitingForFirstVisitProps = { site: Site; initialStatus: InstallStatus }

/**
 * The site's dashboard before its first visit: the watch banner on top,
 * the dashboard's own skeleton below, so the page the owner is about to
 * see is already in place when the first visit lands.
 */
export function WaitingForFirstVisit({
  site,
  initialStatus,
}: WaitingForFirstVisitProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <FirstVisitWatch
        siteId={site.id}
        domain={site.domain}
        initialStatus={initialStatus}
      />
      <div aria-hidden="true" className="space-y-4 sm:space-y-5">
        <Card className="overflow-hidden">
          <KpiStripSkeleton />
          <div className="px-3 pb-3 sm:px-5 sm:pb-4">
            <ChartSkeleton />
          </div>
        </Card>
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {["sources", "pages", "locations", "devices"].map((card) => (
            <Card key={card} className={`${FIXED_CARD_HEIGHT} p-2.5`}>
              <BreakdownSkeleton />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
