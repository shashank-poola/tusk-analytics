import type { StatsBreakdownResponse } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

import { Card, FIXED_CARD_HEIGHT } from "@/components/ui/card"
import { routes } from "@/lib/routes"

import {
  BREAKDOWN_CARDS,
  type BreakdownCardKey,
  type DashboardView,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import { BreakdownDialog } from "./breakdown-dialog"
import { BreakdownRows } from "./breakdown-rows"
import { NoData } from "@/features/analytics/components/empty-state"

/** Rows shown in the card; "Details" opens the rest (up to 50). */
const TOP_ROWS = 8

type BreakdownCardProps = {
  card: BreakdownCardKey
  siteId: string
  /** The page's view: switching tab keeps the period and the other tabs. */
  view: DashboardView
  children: React.ReactNode
}

/**
 * One breakdown card with its tabs. The card has a fixed height, so it looks
 * the same with no rows, one row or a full list, and nothing below it jumps
 * while its rows load or change tab.
 */
export function BreakdownCard({
  card,
  siteId,
  view,
  children,
}: BreakdownCardProps) {
  const { tabs } = view
  const active = BREAKDOWN_CARDS[card].find(({ by }) => by === tabs[card])
  return (
    <Card
      aria-label={active?.label ?? card}
      className={`flex ${FIXED_CARD_HEIGHT} flex-col p-2 sm:p-2.5`}
    >
      <div className="flex min-h-11 items-center justify-between gap-2 pr-2">
        <nav
          aria-label={`${card} breakdown`}
          className="min-w-0 overflow-x-auto"
        >
          <ul className="inline-flex gap-0.5 rounded-xl bg-muted p-0.5">
            {BREAKDOWN_CARDS[card].map(({ by, label }) => (
              <li key={by}>
                <Link
                  href={routes.site(
                    siteId,
                    viewSearch(view, { tabs: { ...tabs, [card]: by } })
                  )}
                  scroll={false}
                  aria-current={by === tabs[card] ? "page" : undefined}
                  className={cn(
                    "inline-flex h-11 items-center rounded-[0.6rem] px-3 text-xs font-medium whitespace-nowrap transition-colors sm:h-8",
                    by === tabs[card]
                      ? "bg-surface text-foreground shadow-card"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          Visitors
        </span>
      </div>
      <div className="mt-2 flex min-h-0 flex-1 flex-col">{children}</div>
    </Card>
  )
}

type BreakdownBodyProps = {
  title: string
  breakdown: StatsBreakdownResponse
}

/** The top rows, with "Details" for up to 50 when there are more. */
export function BreakdownBody({ title, breakdown }: BreakdownBodyProps) {
  const { rows } = breakdown
  if (rows.length === 0) return <NoData />
  return (
    <>
      <BreakdownRows
        label={`Top ${title.toLowerCase()}`}
        breakdown={{ ...breakdown, rows: rows.slice(0, TOP_ROWS) }}
      />
      {rows.length > TOP_ROWS && (
        <div className="mt-auto flex justify-center pt-1">
          <BreakdownDialog title={title} count={rows.length}>
            <BreakdownRows
              label={`All ${title.toLowerCase()}`}
              breakdown={breakdown}
            />
          </BreakdownDialog>
        </div>
      )}
    </>
  )
}
