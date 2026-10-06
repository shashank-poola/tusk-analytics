import { describe, expect, it } from "vitest"

import {
  nextPeriod,
  periodLabel,
  previousPeriod,
  siteClock,
  siteToday,
} from "@/features/analytics/utils/period-nav"

/** Tuesday 2026-10-06, noon UTC; 17:30 in Kolkata. */
const NOW = new Date("2026-10-06T12:00:00.000Z")

describe("period labels", () => {
  it("names running presets and yesterday", () => {
    expect(periodLabel({ range: "7d", offset: 0 }, "UTC", NOW)).toBe(
      "Last 7 days"
    )
    expect(periodLabel({ range: "today", offset: 1 }, "UTC", NOW)).toBe(
      "Yesterday"
    )
  })

  it("names an earlier period by the dates it covers", () => {
    expect(periodLabel({ range: "7d", offset: 1 }, "UTC", NOW)).toBe(
      "Sep 23 – Sep 29"
    )
    expect(periodLabel({ range: "today", offset: 2 }, "UTC", NOW)).toBe(
      "Sun, Oct 4"
    )
    expect(
      periodLabel(
        { range: "custom", from: "2025-12-20", to: "2026-01-05" },
        "UTC",
        NOW
      )
    ).toBe("Dec 20, 2025 – Jan 5, 2026")
  })

  it("reads today and the time where the site is", () => {
    expect(siteToday("Asia/Kolkata", new Date("2026-10-06T20:00:00Z"))).toBe(
      "2026-10-07"
    )
    expect(siteClock("Asia/Kolkata", NOW)).toBe("5:30 PM")
  })
})

describe("stepping periods", () => {
  it("steps a preset back by one whole period and forward until now", () => {
    expect(previousPeriod({ range: "30d", offset: 0 })).toEqual({
      range: "30d",
      offset: 1,
    })
    expect(nextPeriod({ range: "30d", offset: 1 }, "2026-10-06")).toEqual({
      range: "30d",
      offset: 0,
    })
    expect(nextPeriod({ range: "30d", offset: 0 }, "2026-10-06")).toBeNull()
  })

  it("shifts a custom period by its length, never into the future", () => {
    const week = {
      range: "custom",
      from: "2026-09-21",
      to: "2026-09-27",
    } as const

    expect(previousPeriod(week)).toEqual({
      range: "custom",
      from: "2026-09-14",
      to: "2026-09-20",
    })
    expect(nextPeriod(week, "2026-10-06")).toEqual({
      range: "custom",
      from: "2026-09-28",
      to: "2026-10-04",
    })
    expect(
      nextPeriod(
        { range: "custom", from: "2026-09-30", to: "2026-10-06" },
        "2026-10-06"
      )
    ).toBeNull()
  })
})
