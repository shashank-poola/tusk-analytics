import type { Site } from "@workspace/contracts"

import { SiteSwitcher } from "@/features/sites/components/site-switcher"

import type { DashboardView } from "@/features/analytics/utils/analytics-params"
import { CHIP_CLASSES } from "./toolbar/chip"
import { FilterChips } from "./toolbar/filter-chips"
import { IntervalMenu } from "./toolbar/interval-menu"
import { PeriodPicker } from "./toolbar/period-picker"
import { RefreshButton } from "./toolbar/refresh-button"

type AnalyticsToolbarProps = {
  site: Site
  /** Every site of the signed-in user, for the site menu. */
  sites: Site[]
  view: DashboardView
  /** When the page rendered: labels and "today" are relative to it. */
  now: Date
}

/** One row above the numbers: site, period, chart interval, refresh, filters. */
export function AnalyticsToolbar({
  site,
  sites,
  view,
  now,
}: AnalyticsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SiteSwitcher current={site} sites={sites} chipClassName={CHIP_CLASSES} />
      <PeriodPicker
        siteId={site.id}
        view={view}
        timeZone={site.timezone}
        now={now}
      />
      <IntervalMenu siteId={site.id} view={view} />
      <RefreshButton />
      <FilterChips siteId={site.id} view={view} />
    </div>
  )
}
