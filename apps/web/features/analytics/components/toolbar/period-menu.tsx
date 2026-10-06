"use client"

import { cn } from "@workspace/ui/lib/utils"
import { CalendarDays, ChevronDown, ChevronLeft } from "lucide-react"
import { ViewLink } from "@/features/analytics/components/view-link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { KBD_CLASSES } from "./chip"
import { DateRangeCalendar } from "./date-range-calendar"

export type PeriodOption = {
  label: string
  href: string
  active: boolean
  /** One-key shortcut, shown as a hint. */
  shortcut?: string
}

type PeriodMenuProps = {
  /** "3:06 AM" where the site is. */
  clock: string
  main: PeriodOption[]
  more: PeriodOption[]
  /** The page URL without its period, for the custom range. */
  customBase: string
  customActive: boolean
  today: string
  customFrom: string | null
  customTo: string | null
}

const ROW_CLASSES =
  "flex h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left text-sm transition-colors hover:bg-muted sm:h-9"

/**
 * DataFast's period menu: the site's time, presets with key hints, "More
 * periods", then Custom, which swaps the list for a two-month calendar.
 */
export function PeriodMenu({
  clock,
  main,
  more,
  customBase,
  customActive,
  today,
  customFrom,
  customTo,
}: PeriodMenuProps) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<"presets" | "custom">("presets")
  const [showMore, setShowMore] = useState(more.some((option) => option.active))

  function close() {
    const menu = ref.current?.closest("details")
    if (menu) menu.open = false
    setView("presets")
  }

  if (view === "custom") {
    return (
      <div ref={ref}>
        <button
          type="button"
          onClick={() => setView("presets")}
          className="mb-1 inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Periods
        </button>
        <DateRangeCalendar
          today={today}
          initialFrom={customFrom}
          initialTo={customTo}
          onApply={(from, to) => {
            const url = new URL(customBase, "http://dashboard")
            url.searchParams.set("range", "custom")
            url.searchParams.set("from", from)
            url.searchParams.set("to", to)
            close()
            router.push(`${url.pathname}${url.search}`, { scroll: false })
          }}
        />
      </div>
    )
  }

  return (
    <div ref={ref} className="w-56">
      <p className="px-2.5 pt-1 pb-2 text-xs text-muted-foreground">
        Current time:{" "}
        <span className="font-semibold text-foreground">{clock}</span>
      </p>
      <Options options={main} />
      <button
        type="button"
        aria-expanded={showMore}
        onClick={() => setShowMore((open) => !open)}
        className={cn(ROW_CLASSES, "text-muted-foreground")}
      >
        <span className="flex-1">More periods</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 transition-transform",
            showMore && "rotate-180"
          )}
        />
      </button>
      {showMore && <Options options={more} />}
      <div className="mt-1 border-t border-border pt-1">
        <button
          type="button"
          onClick={() => setView("custom")}
          className={cn(ROW_CLASSES, customActive && "bg-muted font-semibold")}
        >
          <span className="flex-1">Custom</span>
          <CalendarDays
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
        </button>
      </div>
    </div>
  )
}

function Options({ options }: { options: PeriodOption[] }) {
  return (
    <ul>
      {options.map((option) => (
        <li key={option.label}>
          <ViewLink
            href={option.href}
            scroll={false}
            aria-current={option.active ? "page" : undefined}
            aria-keyshortcuts={option.shortcut?.toUpperCase()}
            className={cn(
              ROW_CLASSES,
              option.active && "bg-muted font-semibold"
            )}
          >
            <span className="flex-1">{option.label}</span>
            {option.shortcut && (
              <kbd aria-hidden="true" className={KBD_CLASSES}>
                {option.shortcut.toUpperCase()}
              </kbd>
            )}
          </ViewLink>
        </li>
      ))}
    </ul>
  )
}
