import type { StatsRange } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

import { TallyMarks } from "@/components/brand/tally-marks"
import { routes } from "@/lib/routes"

import { RANGE_PERIODS } from "./analytics-params"

type EmptyStateProps = {
  siteId: string
  range: StatsRange
  /**
   * A quieter version for breakdown cards, without the next step: the chart
   * above already offers it, once per page.
   */
  compact?: boolean
}

/**
 * The site has events, just none in this range. Points to the longest range,
 * or back to the install snippet when even that is empty.
 */
export function EmptyState({
  siteId,
  range,
  compact = false,
}: EmptyStateProps) {
  const next =
    range === "90d"
      ? {
          href: routes.installSnippet(siteId),
          label: "Check the install snippet",
        }
      : {
          href: routes.site(siteId, { range: "90d" }),
          label: "See the last 90 days",
        }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 py-8" : "gap-3 py-14"
      )}
    >
      <TallyMarks
        className={cn(
          "text-muted-foreground/40",
          compact ? "size-8" : "size-12"
        )}
      />
      <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>
        No visits in this period
      </p>
      {compact ? null : (
        <>
          <p className="max-w-xs text-sm text-muted-foreground">
            Nobody stopped by in {RANGE_PERIODS[range]}. Once they do, the tally
            starts here.
          </p>
          <Link
            href={next.href}
            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-accent transition-colors hover:bg-accent-soft sm:min-h-9"
          >
            {next.label}
          </Link>
        </>
      )}
    </div>
  )
}
