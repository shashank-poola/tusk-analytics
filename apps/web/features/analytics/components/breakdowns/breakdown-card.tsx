import { ArrowDownWideNarrow } from "lucide-react"

import { Card, FIXED_CARD_HEIGHT } from "@/components/ui/card"
import { routes } from "@/lib/routes"

import {
  type DashboardView,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import {
  BREAKDOWN_CARDS,
  type BreakdownCardKey,
  cardTab,
} from "@/features/analytics/utils/breakdown-tabs"
import { TabPills } from "@/features/analytics/components/tab-pills"

type BreakdownCardProps = {
  card: BreakdownCardKey
  siteId: string
  /** The page's view: switching tab keeps the period, filters and other tabs. */
  view: DashboardView
  children: React.ReactNode
}

/**
 * One breakdown card with its tabs and the sort it shows. The card has a
 * fixed height, so it looks the same with no rows, one row or a full list,
 * and nothing below it jumps while its rows load or change tab.
 */
export function BreakdownCard({
  card,
  siteId,
  view,
  children,
}: BreakdownCardProps) {
  const active = cardTab(card, view.tabs[card])
  const tabs = BREAKDOWN_CARDS[card].tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    href: routes.site(
      siteId,
      viewSearch(view, { tabs: { ...view.tabs, [card]: tab.id } })
    ),
  }))
  return (
    <Card
      aria-label={active.label}
      className={`flex ${FIXED_CARD_HEIGHT} flex-col p-2.5`}
    >
      <div className="flex min-h-11 items-center justify-between gap-2 pr-1.5">
        <TabPills label={`${card} breakdown`} tabs={tabs} active={active.id} />
        {!active.chart && (
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold">
            Visitors
            <ArrowDownWideNarrow
              aria-hidden="true"
              className="size-3.5 text-muted-foreground"
            />
            <span className="sr-only">, most first</span>
          </span>
        )}
      </div>
      <div className="mt-2 flex min-h-0 flex-1 flex-col">{children}</div>
    </Card>
  )
}
