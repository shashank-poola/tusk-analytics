import type { StatsRange } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

import { routes } from "@/lib/routes"

import { RANGE_PERIODS, RANGES, type DeviceTab } from "./analytics-params"

type RangePickerProps = {
  siteId: string
  range: StatsRange
  /** Kept in the links so switching range doesn't reset the Devices tab. */
  tab: DeviceTab
}

/**
 * The range as plain links: shareable, server-rendered, and usable with the
 * keyboard without any client JavaScript.
 */
export function RangePicker({ siteId, range, tab }: RangePickerProps) {
  return (
    <nav aria-label="Date range" className="-mx-1 overflow-x-auto px-1">
      <ul className="inline-flex rounded-full border border-border bg-surface p-1 shadow-card">
        {RANGES.map((value) => (
          <li key={value}>
            <Link
              href={routes.site(siteId, { range: value, tab })}
              scroll={false}
              aria-current={value === range ? "page" : undefined}
              aria-label={RANGE_PERIODS[value]}
              className={cn(
                "inline-flex h-11 min-w-12 items-center justify-center rounded-full px-3 text-sm font-medium tabular-nums transition-colors sm:h-9",
                value === range
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {value}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
