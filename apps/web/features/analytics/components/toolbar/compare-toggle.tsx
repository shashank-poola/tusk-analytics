import type { StatsPeriod } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { ViewLink } from "@/features/analytics/components/view-link"

import { routes } from "@/lib/routes"

import {
  type DashboardView,
  PRESET_LABELS,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import { CHIP_CLASSES } from "./chip"

/** "Yesterday", "previous 7 days", "previous period". */
function previousName(period: StatsPeriod): string {
  if (period.range === "today") return "Yesterday"
  if (period.range === "now") return "previous 30 min"
  if (period.range === "custom" || period.offset > 0) return "previous period"
  return PRESET_LABELS[period.range].replace("Last", "previous")
}

type CompareToggleProps = { siteId: string; view: DashboardView }

/**
 * DataFast's "vs Yesterday": draws the previous period as a dotted line on
 * the chart. Off by default; a link, so it lives in the URL.
 */
export function CompareToggle({ siteId, view }: CompareToggleProps) {
  return (
    <ViewLink
      href={routes.site(siteId, viewSearch(view, { compare: !view.compare }))}
      scroll={false}
      className={cn(
        CHIP_CLASSES,
        view.compare
          ? "border-transparent bg-muted text-foreground"
          : "text-muted-foreground"
      )}
    >
      <span className={cn(!view.compare && "opacity-80")}>vs</span>{" "}
      <span className="font-semibold">{previousName(view.period)}</span>
      <span className="sr-only">, {view.compare ? "on" : "off"}</span>
    </ViewLink>
  )
}
