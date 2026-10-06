import type { StatsFilters } from "@workspace/contracts"
import { X } from "lucide-react"
import { ViewLink } from "@/features/analytics/components/view-link"

import { routes } from "@/lib/routes"

import {
  type DashboardView,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import { filterChips } from "@/features/analytics/utils/filters"

type FilterChipsProps = { siteId: string; view: DashboardView }

/**
 * The active filters, one removable chip each, and "Clear" when there are
 * several. Values are tracker input, rendered as text.
 */
export function FilterChips({ siteId, view }: FilterChipsProps) {
  const chips = filterChips(view.filters)
  if (chips.length === 0) return null
  const without = (filters: StatsFilters) =>
    routes.site(siteId, viewSearch(view, { filters }))
  return (
    <ul aria-label="Filters" className="flex flex-wrap items-center gap-2">
      {chips.map(({ key, label, value }) => (
        <li key={key}>
          <ViewLink
            href={without({ ...view.filters, [key]: undefined })}
            scroll={false}
            aria-label={`Remove filter ${label}: ${value}`}
            className="inline-flex h-11 max-w-72 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft px-3 text-sm transition-colors hover:border-accent sm:h-9"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="truncate font-medium">{value}</span>
            <X aria-hidden="true" className="size-3.5 shrink-0" />
          </ViewLink>
        </li>
      ))}
      {chips.length > 1 && (
        <li>
          <ViewLink
            href={without({})}
            scroll={false}
            className="inline-flex h-11 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:h-9"
          >
            Clear
          </ViewLink>
        </li>
      )}
    </ul>
  )
}
