import { Card } from "@/components/ui/card"
import { routes } from "@/lib/routes"

import {
  type DashboardView,
  INSIGHT_TABS,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import { TabPills } from "@/features/analytics/components/tab-pills"

type InsightsCardProps = {
  siteId: string
  view: DashboardView
  children: React.ReactNode
}

/**
 * The big bottom card: Goal / Funnel / User, a tab in `?insights=`. Each
 * view draws its own controls (search, funnel menu) in the top right
 * corner, next to the tabs.
 */
export function InsightsCard({ siteId, view, children }: InsightsCardProps) {
  const tabs = INSIGHT_TABS.map((tab) => ({
    ...tab,
    href: routes.site(siteId, viewSearch(view, { insights: tab.id })),
  }))
  const active = INSIGHT_TABS.find((tab) => tab.id === view.insights)
  return (
    <Card
      aria-label={active?.label ?? "Insights"}
      className="relative flex h-[32rem] flex-col p-2.5"
    >
      <div className="flex min-h-11 items-center pr-1.5">
        <TabPills label="Insights" tabs={tabs} active={view.insights} />
      </div>
      <div className="mt-2 flex min-h-0 flex-1 flex-col">{children}</div>
    </Card>
  )
}

/** A view's controls, laid in the card's top right corner. */
export function InsightsControls({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-end gap-2 max-sm:mb-2 sm:absolute sm:top-2.5 sm:right-2.5">
      {children}
    </div>
  )
}
