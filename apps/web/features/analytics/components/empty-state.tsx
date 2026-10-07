import { periodDays } from "@workspace/contracts"
import { ViewLink } from "@/features/analytics/components/view-link"

import { routes } from "@/lib/routes"

import {
  type DashboardView,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"

/** A card with nothing to list: the frame stays, a quiet pill says so. */
export function NoData({ label = "No data" }: { label?: string }) {
  return (
    <div className="grid h-full min-h-32 place-items-center">
      <p className="rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

type ChartEmptyStateProps = { siteId: string; view: DashboardView }

/**
 * Laid over the flat chart when the period has no visits. Points to the
 * last 90 days, or back to the install snippet when even that long is empty.
 */
export function ChartEmptyState({ siteId, view }: ChartEmptyStateProps) {
  const next =
    periodDays(view.period) >= 90
      ? {
          href: routes.installSnippet(siteId),
          label: "Check the install snippet",
        }
      : {
          href: routes.site(
            siteId,
            viewSearch(view, { period: { range: "90d", offset: 0 } })
          ),
          label: "See the last 90 days",
        }

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="pointer-events-auto flex animate-rise flex-col items-center gap-2 rounded-2xl border-2 border-border bg-surface/90 px-5 py-4 text-center shadow-pop backdrop-blur">
        <p className="text-sm font-medium">No visits in this period</p>
        <ViewLink
          href={next.href}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-link transition-colors hover:bg-accent-soft sm:min-h-8"
        >
          {next.label}
        </ViewLink>
      </div>
    </div>
  )
}
