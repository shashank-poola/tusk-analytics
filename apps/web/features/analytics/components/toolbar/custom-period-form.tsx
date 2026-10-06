import Form from "next/form"

import { routes } from "@/lib/routes"

import {
  type DashboardView,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"

/** Replaced by the form's own fields; the interval resets with the period. */
const PERIOD_PARAMS = new Set(["range", "offset", "from", "to", "interval"])

const DATE_INPUT_CLASSES =
  "block h-9 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground"

type CustomPeriodFormProps = {
  siteId: string
  view: DashboardView
  /** The site's today: the latest day you can pick. */
  today: string
}

/**
 * Two native date fields: no date-picker library, keyboard and screen
 * reader friendly. A GET form, so it works before hydration; the other
 * params ride along as hidden fields.
 */
export function CustomPeriodForm({
  siteId,
  view,
  today,
}: CustomPeriodFormProps) {
  const current = view.period.range === "custom" ? view.period : null
  const kept = Object.entries(viewSearch(view)).filter(
    ([name]) => !PERIOD_PARAMS.has(name)
  )
  return (
    <Form
      action={routes.site(siteId)}
      scroll={false}
      className="space-y-2 px-3 py-2"
    >
      <p className="text-xs font-semibold text-muted-foreground">Custom</p>
      <input type="hidden" name="range" value="custom" />
      {kept.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          From
          <input
            type="date"
            name="from"
            required
            max={today}
            defaultValue={current?.from ?? today}
            className={DATE_INPUT_CLASSES}
          />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          To
          <input
            type="date"
            name="to"
            required
            max={today}
            defaultValue={current?.to ?? today}
            className={DATE_INPUT_CLASSES}
          />
        </label>
      </div>
      <button
        type="submit"
        className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
      >
        Apply
      </button>
    </Form>
  )
}
