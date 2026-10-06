import { allowedIntervals, statsIntervalSchema } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import Link from "next/link"

import { Menu } from "@/components/ui/menu"
import { MENU_ITEM_CLASSES } from "@/components/ui/menu-styles"
import { routes } from "@/lib/routes"

import {
  type DashboardView,
  INTERVAL_LABELS,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import { CHIP_CLASSES } from "./chip"

type IntervalMenuProps = { siteId: string; view: DashboardView }

/** Hourly / Daily / Weekly / Monthly; ones that would draw too many points are off. */
export function IntervalMenu({ siteId, view }: IntervalMenuProps) {
  const allowed = allowedIntervals(view.period)
  return (
    <Menu
      label={`Chart interval: ${INTERVAL_LABELS[view.interval]}`}
      triggerClassName="rounded-lg px-0 hover:bg-transparent"
      panelClassName="w-48"
      trigger={
        <span className={CHIP_CLASSES}>
          {INTERVAL_LABELS[view.interval]}
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </span>
      }
    >
      <ul>
        {statsIntervalSchema.options.map((interval) => {
          const active = interval === view.interval
          if (!allowed.includes(interval)) {
            return (
              <li
                key={interval}
                aria-disabled="true"
                title="Too many points for this period"
                className={cn(
                  MENU_ITEM_CLASSES,
                  "text-muted-foreground/50 hover:bg-transparent"
                )}
              >
                {INTERVAL_LABELS[interval]}
              </li>
            )
          }
          return (
            <li key={interval}>
              <Link
                href={routes.site(siteId, viewSearch(view, { interval }))}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={MENU_ITEM_CLASSES}
              >
                <span className="flex-1">{INTERVAL_LABELS[interval]}</span>
                <Check
                  aria-hidden="true"
                  className={cn("size-4 text-accent", !active && "invisible")}
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </Menu>
  )
}
