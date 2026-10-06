import type { PresetRange, StatsPeriod } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { ViewLink } from "@/features/analytics/components/view-link"

import { Menu } from "@/components/ui/menu"
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
import { type PeriodOption, PeriodMenu } from "./period-menu"
import { PeriodShortcuts } from "./period-shortcuts"

type MenuEntry = {
  label: string
  period: StatsPeriod
  key?: string
  /** A live period: gets the green dot. */
  live?: boolean
}

const preset = (range: PresetRange, offset = 0): StatsPeriod => ({
  range,
  offset,
})

const MAIN_ENTRIES: MenuEntry[] = [
  { label: PRESET_LABELS.now, period: preset("now"), key: "n", live: true },
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

const PERIOD_PARAMS = new Set(["range", "offset", "from", "to", "interval"])

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
  const custom = view.period.range === "custom" ? view.period : null
  const option = ({ label, period, key, live }: MenuEntry): PeriodOption => ({
    label,
    href: href(period),
    active: samePeriod(period, view.period),
    shortcut: key,
    live,
  })
  // Everything but the period and interval, which the custom range replaces.
  const keptSearch = Object.fromEntries(
    Object.entries(viewSearch(view)).filter(
      ([name]) => !PERIOD_PARAMS.has(name)
    )
  )
  const shortcuts = Object.fromEntries(
    MAIN_ENTRIES.flatMap(({ key, period }) =>
      key ? [[key, href(period)]] : []
    )
  )

  return (
    <div className="inline-flex h-11 items-stretch overflow-visible rounded-lg border border-border bg-surface text-sm font-medium sm:h-9">
      <PeriodShortcuts links={shortcuts} />
      <ViewLink
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
      </ViewLink>
      <div className="flex border-x border-border">
        <Menu
          label={`Period: ${label}`}
          className="h-full"
          triggerClassName="h-full min-h-0 rounded-none px-3 sm:min-h-0"
          panelClassName="w-auto"
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
          <PeriodMenu
            clock={siteClock(timeZone, now)}
            main={MAIN_ENTRIES.map(option)}
            more={MORE_ENTRIES.map(option)}
            customBase={routes.site(siteId, keptSearch)}
            customActive={custom !== null}
            today={today}
            customFrom={custom?.from ?? null}
            customTo={custom?.to ?? null}
          />
        </Menu>
      </div>
      {next ? (
        <ViewLink
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
        </ViewLink>
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
