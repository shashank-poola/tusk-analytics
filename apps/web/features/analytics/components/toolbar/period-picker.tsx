import type { PresetRange, StatsPeriod } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

import { Menu, MENU_ITEM_CLASSES } from "@/components/ui/menu"
import { routes } from "@/lib/routes"

import {
  type DashboardView,
  PRESET_LABELS,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import {
  nextPeriod,
  periodLabel,
  previousPeriod,
  siteClock,
  siteToday,
} from "@/features/analytics/utils/period-nav"
import { KBD_CLASSES } from "./chip"
import { CustomPeriodForm } from "./custom-period-form"
import { PeriodShortcuts } from "./period-shortcuts"

type MenuEntry = { label: string; period: StatsPeriod; key?: string }

const preset = (range: PresetRange, offset = 0): StatsPeriod => ({
  range,
  offset,
})

const MAIN_ENTRIES: MenuEntry[] = [
  { label: PRESET_LABELS.today, period: preset("today"), key: "t" },
  { label: "Yesterday", period: preset("today", 1), key: "y" },
  { label: PRESET_LABELS["24h"], period: preset("24h"), key: "h" },
  { label: PRESET_LABELS["7d"], period: preset("7d"), key: "w" },
  { label: PRESET_LABELS["30d"], period: preset("30d"), key: "m" },
]

const MORE_ENTRIES: MenuEntry[] = [
  { label: PRESET_LABELS["90d"], period: preset("90d") },
  { label: PRESET_LABELS["12mo"], period: preset("12mo") },
]

const SEGMENT_CLASSES =
  "inline-grid h-full w-10 place-items-center text-muted-foreground transition-colors sm:w-8"

type PeriodPickerProps = {
  siteId: string
  view: DashboardView
  /** The site's IANA time zone: days and labels are the site's. */
  timeZone: string
  now: Date
}

const samePeriod = (a: StatsPeriod, b: StatsPeriod) =>
  JSON.stringify(a) === JSON.stringify(b)

/**
 * The period as one pill: ‹ steps back a whole period, the label opens the
 * menu (presets with key hints, more periods, custom dates), › steps
 * forward until the period reaches today.
 */
export function PeriodPicker({
  siteId,
  view,
  timeZone,
  now,
}: PeriodPickerProps) {
  const href = (period: StatsPeriod) =>
    routes.site(siteId, viewSearch(view, { period }))
  const today = siteToday(timeZone, now)
  const previous = previousPeriod(view.period)
  const next = nextPeriod(view.period, today)
  const label = periodLabel(view.period, timeZone, now)
  const shortcuts = Object.fromEntries(
    MAIN_ENTRIES.flatMap(({ key, period }) =>
      key ? [[key, href(period)]] : []
    )
  )

  return (
    <div className="inline-flex h-11 items-stretch overflow-visible rounded-lg border border-border bg-surface text-sm font-medium sm:h-9">
      <PeriodShortcuts links={shortcuts} />
      <Link
        href={href(previous)}
        scroll={false}
        aria-label="Previous period"
        title="Previous period"
        className={cn(
          SEGMENT_CLASSES,
          "rounded-l-lg hover:bg-muted hover:text-foreground"
        )}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </Link>
      <div className="border-x border-border">
        <Menu
          label={`Period: ${label}`}
          triggerClassName="h-full min-h-0 rounded-none px-3 sm:min-h-0"
          panelClassName="w-64"
          trigger={
            <>
              <CalendarDays
                aria-hidden="true"
                className="size-4 text-muted-foreground sm:hidden"
              />
              <span className="whitespace-nowrap">{label}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
              />
            </>
          }
        >
          <p className="px-3 pt-1 pb-2 text-xs text-muted-foreground">
            Current time:{" "}
            <span className="font-semibold text-foreground">
              {siteClock(timeZone, now)}
            </span>
          </p>
          <PeriodLinks
            entries={MAIN_ENTRIES}
            current={view.period}
            href={href}
          />
          <details
            className="group/more"
            open={MORE_ENTRIES.some(({ period }) =>
              samePeriod(period, view.period)
            )}
          >
            <summary
              className={cn(
                MENU_ITEM_CLASSES,
                "cursor-pointer list-none text-muted-foreground [&::-webkit-details-marker]:hidden"
              )}
            >
              <span className="flex-1">More periods</span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform group-open/more:rotate-180"
              />
            </summary>
            <PeriodLinks
              entries={MORE_ENTRIES}
              current={view.period}
              href={href}
            />
          </details>
          <div className="mt-1.5 border-t border-border pt-1.5">
            <CustomPeriodForm siteId={siteId} view={view} today={today} />
          </div>
        </Menu>
      </div>
      {next ? (
        <Link
          href={href(next)}
          scroll={false}
          aria-label="Next period"
          title="Next period"
          className={cn(
            SEGMENT_CLASSES,
            "rounded-r-lg hover:bg-muted hover:text-foreground"
          )}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={cn(SEGMENT_CLASSES, "text-muted-foreground/40")}
        >
          <ChevronRight className="size-4" />
        </span>
      )}
    </div>
  )
}

type PeriodLinksProps = {
  entries: MenuEntry[]
  current: StatsPeriod
  href: (period: StatsPeriod) => string
}

function PeriodLinks({ entries, current, href }: PeriodLinksProps) {
  return (
    <ul>
      {entries.map(({ label, period, key }) => {
        const active = samePeriod(period, current)
        return (
          <li key={label}>
            <Link
              href={href(period)}
              scroll={false}
              aria-current={active ? "page" : undefined}
              aria-keyshortcuts={key?.toUpperCase()}
              className={cn(
                MENU_ITEM_CLASSES,
                active && "bg-muted font-semibold"
              )}
            >
              <span className="flex-1">{label}</span>
              {key && (
                <kbd aria-hidden="true" className={KBD_CLASSES}>
                  {key.toUpperCase()}
                </kbd>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
