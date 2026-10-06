import type { Site, StatsRange } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { CalendarDays, Check, ChevronDown, Settings2 } from "lucide-react"
import Link from "next/link"

import { Menu, MENU_ITEM_CLASSES } from "@/components/ui/menu"
import { SiteFavicon } from "@/features/sites/components/site-favicon"
import { routes } from "@/lib/routes"

import {
  type BreakdownTabs,
  RANGE_LABELS,
  RANGES,
} from "@/features/analytics/utils/analytics-params"

const CHIP_CLASSES =
  "inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold shadow-card sm:h-10"

type AnalyticsToolbarProps = {
  site: Site
  range: StatsRange
  /** Kept in the range links so switching range keeps the open tabs. */
  tabs: BreakdownTabs
}

/** The site (with its own favicon) and the date range, above the numbers. */
export function AnalyticsToolbar({ site, range, tabs }: AnalyticsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className={cn(CHIP_CLASSES, "pr-1")}>
        <SiteFavicon siteId={site.id} domain={site.domain} />
        <span className="max-w-[14rem] truncate">{site.domain}</span>
        <Link
          href={routes.installSnippet(site.id)}
          aria-label={`Tracking code for ${site.domain}`}
          title="Tracking code"
          className="ml-1 inline-grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-8"
        >
          <Settings2 aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <Menu
        label={`Date range: ${RANGE_LABELS[range]}`}
        triggerClassName="rounded-xl px-0 hover:bg-transparent [&>span]:hover:bg-muted"
        trigger={
          <span className={CHIP_CLASSES}>
            <CalendarDays
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            {RANGE_LABELS[range]}
            <ChevronDown
              aria-hidden="true"
              className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
            />
          </span>
        }
      >
        <ul>
          {RANGES.map((value) => (
            <li key={value}>
              <Link
                href={routes.site(site.id, { range: value, ...tabs })}
                scroll={false}
                aria-current={value === range ? "page" : undefined}
                className={MENU_ITEM_CLASSES}
              >
                <span className="flex-1">{RANGE_LABELS[value]}</span>
                <Check
                  aria-hidden="true"
                  className={cn(
                    "size-4 text-accent",
                    value !== range && "invisible"
                  )}
                />
              </Link>
            </li>
          ))}
        </ul>
      </Menu>
    </div>
  )
}
