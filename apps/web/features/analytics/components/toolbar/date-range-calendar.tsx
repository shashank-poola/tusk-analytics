"use client"

import { STATS_MAX_CUSTOM_DAYS } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

import { BUTTON_CLASSES } from "@/components/ui/button-styles"
import { LOCALE } from "@/features/analytics/utils/format"
import {
  addMonths,
  daysBetween,
  type Month,
  monthOf,
  monthWeeks,
  parseDate,
  sameMonth,
} from "@/features/analytics/utils/calendar"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const monthTitle = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})
const dayLabel = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

type DateRangeCalendarProps = {
  /** The site's today: later days can't be picked. */
  today: string
  initialFrom: string | null
  initialTo: string | null
  onApply: (from: string, to: string) => void
}

/**
 * DataFast's custom range picker: two months side by side, click a start
 * then an end day (in either order), or type them. No date library.
 */
export function DateRangeCalendar({
  today,
  initialFrom,
  initialTo,
  onApply,
}: DateRangeCalendarProps) {
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [right, setRight] = useState<Month>(monthOf(initialTo ?? today))
  const left = addMonths(right, -1)
  const atToday = sameMonth(right, monthOf(today))

  function pick(day: string) {
    if (!from || to) {
      setFrom(day)
      setTo(null)
      return
    }
    if (day < from) {
      setTo(from)
      setFrom(day)
      return
    }
    setTo(day)
  }

  const tooLong =
    from && to ? daysBetween(from, to) > STATS_MAX_CUSTOM_DAYS : false

  return (
    <div className="w-[min(40rem,calc(100vw-3rem))] p-2">
      <div className="grid gap-6 sm:grid-cols-2">
        {[left, right].map((month, index) => (
          <section
            key={`${month.year}-${month.month}`}
            aria-label={monthTitle.format(Date.UTC(month.year, month.month))}
            className={cn(index === 0 && "max-sm:hidden")}
          >
            <header className="mb-3 flex h-8 items-center justify-between">
              {/* Desktop: ‹ on the left month, › on the right. Phones see
                  only the right month, with both. */}
              <NavButton
                label="Previous month"
                className={cn(index === 1 && "sm:invisible")}
                onClick={() => setRight(addMonths(right, -1))}
              >
                <ChevronLeft className="size-4" />
              </NavButton>
              <h3 className="flex-1 text-center text-sm font-semibold">
                {monthTitle.format(Date.UTC(month.year, month.month))}
              </h3>
              <NavButton
                label="Next month"
                className={cn(index === 0 && "invisible")}
                disabled={atToday}
                onClick={() => setRight(addMonths(right, 1))}
              >
                <ChevronRight className="size-4" />
              </NavButton>
            </header>
            <table className="w-full table-fixed text-center text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  {WEEKDAYS.map((weekday) => (
                    <th key={weekday} scope="col" className="pb-2 font-medium">
                      {weekday}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthWeeks(month).map((week) => (
                  <tr key={week.find(Boolean) ?? "blank"}>
                    {week.map((day, cell) => (
                      // Blank cells have no date; their place in the week is their key.
                      // eslint-disable-next-line react/no-array-index-key
                      <td key={day ?? `blank-${cell}`} className="p-0.5">
                        {day && (
                          <DayButton
                            day={day}
                            today={today}
                            from={from}
                            to={to}
                            onPick={pick}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm">
        <DateField
          label="Start"
          value={from}
          today={today}
          onChange={setFrom}
        />
        <DateField label="End" value={to} today={today} onChange={setTo} />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFrom(null)
              setTo(null)
            }}
            className="inline-flex h-11 items-center rounded-lg px-3 font-medium text-muted-foreground transition-colors hover:text-foreground sm:h-9"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!from || !to || tooLong}
            onClick={() => from && to && onApply(from, to)}
            className={BUTTON_CLASSES.primary}
          >
            Apply
          </button>
        </div>
      </div>
      {tooLong && (
        <p role="alert" className="mt-2 text-xs text-negative">
          Pick at most {STATS_MAX_CUSTOM_DAYS} days.
        </p>
      )}
    </div>
  )
}

type DayButtonProps = {
  day: string
  today: string
  from: string | null
  to: string | null
  onPick: (day: string) => void
}

function DayButton({ day, today, from, to, onPick }: DayButtonProps) {
  const edge = day === from || day === to
  const inside = Boolean(from && to && day > from && day < to)
  return (
    <button
      type="button"
      disabled={day > today}
      onClick={() => onPick(day)}
      aria-label={dayLabel.format(Date.parse(`${day}T00:00:00Z`))}
      aria-pressed={edge || inside}
      className={cn(
        "inline-grid h-10 w-full place-items-center rounded-lg tabular-nums transition-colors disabled:cursor-default disabled:text-muted-foreground/40 sm:h-9",
        edge && "bg-accent font-semibold text-accent-foreground",
        inside && "bg-muted",
        !edge && !inside && "hover:bg-muted enabled:hover:text-foreground",
        day === today && !edge && "underline underline-offset-4"
      )}
    >
      {Number(day.slice(8))}
    </button>
  )
}

type NavButtonProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

function NavButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: NavButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent sm:size-8",
        className
      )}
    >
      {children}
    </button>
  )
}

type DateFieldProps = {
  label: string
  value: string | null
  today: string
  onChange: (date: string | null) => void
}

/** The picked day as text, editable; only a real date up to today counts. */
function DateField({ label, value, today, onChange }: DateFieldProps) {
  const [draft, setDraft] = useState(value ?? "")
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    setDraft(value ?? "")
  }
  return (
    <label className="flex items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <input
        value={draft}
        placeholder="YYYY-MM-DD"
        inputMode="numeric"
        maxLength={10}
        onChange={(event) => {
          setDraft(event.target.value)
          const date = parseDate(event.target.value)
          if (date && date <= today) onChange(date)
        }}
        className="h-11 w-32 rounded-xl border-2 border-border bg-surface px-2.5 tabular-nums placeholder:text-muted-foreground/60 focus:border-accent focus:ring-3 focus:ring-accent-soft focus:outline-none sm:h-9"
      />
    </label>
  )
}
