import { cn } from "@workspace/ui/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

import { Card } from "@/components/ui/card"

type OverviewCardProps = {
  /** The KPI strip; streams in on its own. */
  totals: React.ReactNode
  /** The chart; streams in on its own. */
  chart: React.ReactNode
  /** The period before this one. */
  previousHref: string
  /** The period after this one; null when this one runs until now. */
  nextHref: string | null
}

const ARROW_CLASSES =
  "absolute top-2 z-10 inline-grid size-11 place-items-center rounded-full text-muted-foreground transition-colors sm:size-7"

/**
 * The headline numbers directly on top of the chart, in one card, with
 * arrows at the chart's edges to step through time.
 */
export function OverviewCard({
  totals,
  chart,
  previousHref,
  nextHref,
}: OverviewCardProps) {
  return (
    <Card aria-label="Overview" className="overflow-hidden">
      <section aria-label="Totals">{totals}</section>
      <div className="relative px-3 pb-3 sm:px-5 sm:pb-4">
        <Link
          href={previousHref}
          scroll={false}
          aria-label="Previous period"
          className={cn(
            ARROW_CLASSES,
            "left-1 hover:bg-muted hover:text-foreground"
          )}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>
        {nextHref ? (
          <Link
            href={nextHref}
            scroll={false}
            aria-label="Next period"
            className={cn(
              ARROW_CLASSES,
              "right-1 hover:bg-muted hover:text-foreground"
            )}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        ) : (
          <span
            aria-hidden="true"
            className={cn(ARROW_CLASSES, "right-1 text-muted-foreground/30")}
          >
            <ChevronRight className="size-4" />
          </span>
        )}
        {chart}
        <ul className="mt-2 flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0.5 w-3 rounded-full bg-chart-1"
            />
            Visitors
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0.5 w-3 rounded-full bg-chart-1 opacity-35"
            />
            Previous period
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-[2px] bg-chart-2"
            />
            Pageviews
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="w-3 border-t-2 border-dashed border-chart-1"
            />
            In progress
          </li>
        </ul>
      </div>
    </Card>
  )
}
