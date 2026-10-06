// Calendar math on local dates as `YYYY-MM-DD` strings, computed in UTC so
// no time zone shifts a day. Weeks start on Sunday, like DataFast's picker.

export type Month = { year: number; month: number }

/** `2026-10-06` → October 2026. */
export function monthOf(date: string): Month {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) - 1 }
}

export function addMonths({ year, month }: Month, count: number): Month {
  const date = new Date(Date.UTC(year, month + count, 1))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}

export function sameMonth(a: Month, b: Month): boolean {
  return a.year === b.year && a.month === b.month
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** The month's days in weeks of seven, `null` before the 1st and after the last. */
export function monthWeeks({ year, month }: Month): (string | null)[][] {
  const first = Date.UTC(year, month, 1)
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const blanks = new Date(first).getUTCDay()
  const cells: (string | null)[] = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: days }, (_, day) =>
      iso(first + day * 24 * 60 * 60 * 1000)
    ),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7)
  )
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** A real calendar date typed as `YYYY-MM-DD`, else null. */
export function parseDate(value: string): string | null {
  const trimmed = value.trim()
  if (!DATE.test(trimmed)) return null
  const ms = Date.parse(`${trimmed}T00:00:00Z`)
  return Number.isNaN(ms) || iso(ms) !== trimmed ? null : trimmed
}

/** Inclusive number of days from `from` to `to`. */
export function daysBetween(from: string, to: string): number {
  return (
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      (24 * 60 * 60 * 1000) +
    1
  )
}
