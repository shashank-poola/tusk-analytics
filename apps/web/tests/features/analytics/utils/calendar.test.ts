import { describe, expect, it } from "vitest"

import {
  addMonths,
  daysBetween,
  monthOf,
  monthWeeks,
  parseDate,
} from "@/features/analytics/utils/calendar"

describe("calendar", () => {
  it("lays a month out in Sunday-first weeks with blanks around it", () => {
    const weeks = monthWeeks({ year: 2026, month: 9 })

    expect(weeks[0]).toEqual([
      null,
      null,
      null,
      null,
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ])
    // October 31, 2026 is a Saturday: the month ends a full week.
    expect(weeks.at(-1)?.at(-1)).toBe("2026-10-31")
    // September 30, 2026 is a Wednesday: three blanks after it.
    expect(monthWeeks({ year: 2026, month: 8 }).at(-1)?.slice(-4)).toEqual([
      "2026-09-30",
      null,
      null,
      null,
    ])
    expect(weeks.flat().filter(Boolean)).toHaveLength(31)
  })

  it("steps months across years", () => {
    expect(addMonths(monthOf("2026-01-15"), -1)).toEqual({
      year: 2025,
      month: 11,
    })
  })

  it("accepts only real dates typed as YYYY-MM-DD", () => {
    expect(parseDate(" 2026-02-28 ")).toBe("2026-02-28")
    expect(parseDate("2026-02-30")).toBeNull()
    expect(parseDate("28-02-2026")).toBeNull()
  })

  it("counts days inclusively", () => {
    expect(daysBetween("2026-10-01", "2026-10-07")).toBe(7)
  })
})
