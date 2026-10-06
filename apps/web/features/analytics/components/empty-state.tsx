import type { StatsRange } from "@workspace/contracts"
import Link from "next/link"

import { TallyMarks } from "@/components/brand/tally-marks"
import { routes } from "@/lib/routes"

/** A card with nothing to list: the frame stays, a quiet pill says so. */
export function NoData({ label = "No data" }: { label?: string }) {
  return (
    <div className="grid h-full min-h-32 place-items-center">
      <p className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

type ChartEmptyStateProps = { siteId: string; range: StatsRange }

/**
 * Laid over the flat chart when the range has no visits. Points to the
 * longest range, or back to the install snippet when even that is empty.
 */
export function ChartEmptyState({ siteId, range }: ChartEmptyStateProps) {
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
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="pointer-events-auto flex animate-rise flex-col items-center gap-2 rounded-2xl border border-border bg-surface/90 px-5 py-4 text-center shadow-pop backdrop-blur">
        <TallyMarks className="size-8 text-accent" />
        <p className="text-sm font-medium">No visits in this period</p>
        <Link
          href={next.href}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-accent transition-colors hover:bg-accent-soft sm:min-h-8"
        >
          {next.label}
        </Link>
      </div>
    </div>
  )
}
