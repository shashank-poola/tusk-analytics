import { describe, expect, it } from "vitest"

import {
  allowedIntervals,
  bucketStarts,
  defaultInterval,
  resolveWindow,
  type StatsPeriod,
  statsPeriodSchema,
} from "../src/stats-period"

/** Tuesday 2026-10-06, noon UTC. */
const NOW = new Date("2026-10-06T12:00:00.000Z")
const IST = 330 * 60_000

const iso = (ms: number) => new Date(ms).toISOString()

function window(period: StatsPeriod, offsetMs = 0) {
  const { fromMs, toMs, previousFromMs } = resolveWindow(period, offsetMs, NOW)
  return { from: iso(fromMs), to: iso(toMs), previousFrom: iso(previousFromMs) }
}

describe("statsPeriodSchema", () => {
  it("defaults a preset's offset to 0 and reads it from the query string", () => {
    expect(statsPeriodSchema.parse({ range: "7d" })).toEqual({
      range: "7d",
      offset: 0,
    })
    expect(statsPeriodSchema.parse({ range: "30d", offset: "2" })).toEqual({
      range: "30d",
      offset: 2,
    })
  })

  it("needs both dates for a custom period, in order, within a year", () => {
    const custom = (from: string, to: string) =>
      statsPeriodSchema.safeParse({ range: "custom", from, to }).success

    expect(custom("2026-09-01", "2026-09-30")).toBe(true)
    expect(custom("2026-09-30", "2026-09-01")).toBe(false)
    expect(custom("2025-09-01", "2026-09-01")).toBe(true)
    expect(custom("2025-09-01", "2026-09-02")).toBe(false)
    expect(statsPeriodSchema.safeParse({ range: "custom" }).success).toBe(false)
  })

  it("rejects unknown ranges and negative offsets", () => {
    expect(statsPeriodSchema.safeParse({ range: "1y" }).success).toBe(false)
    expect(
      statsPeriodSchema.safeParse({ range: "7d", offset: "-1" }).success
    ).toBe(false)
  })
})

describe("resolveWindow", () => {
  it("ends presets now, from local midnight or the hour", () => {
    expect(window({ range: "7d", offset: 0 })).toEqual({
      from: "2026-09-30T00:00:00.000Z",
      to: "2026-10-06T12:00:00.000Z",
      previousFrom: "2026-09-23T12:00:00.000Z",
    })
    expect(window({ range: "24h", offset: 0 }).from).toBe(
      "2026-10-05T13:00:00.000Z"
    )
    expect(window({ range: "today", offset: 0 }, IST).from).toBe(
      "2026-10-05T18:30:00.000Z"
    )
  })

  it("steps whole periods back with offset, so the window is complete", () => {
    expect(window({ range: "today", offset: 1 })).toEqual({
      from: "2026-10-05T00:00:00.000Z",
      to: "2026-10-06T00:00:00.000Z",
      previousFrom: "2026-10-04T00:00:00.000Z",
    })
    expect(window({ range: "7d", offset: 1 })).toMatchObject({
      from: "2026-09-23T00:00:00.000Z",
      to: "2026-09-30T00:00:00.000Z",
    })
  })

  it("covers whole months for 12mo", () => {
    expect(window({ range: "12mo", offset: 0 }).from).toBe(
      "2025-11-01T00:00:00.000Z"
    )
    expect(window({ range: "12mo", offset: 1 })).toMatchObject({
      from: "2024-11-01T00:00:00.000Z",
      to: "2025-11-01T00:00:00.000Z",
    })
  })

  it("runs a custom period from the start of `from` to the end of `to`, never past now", () => {
    expect(
      window({ range: "custom", from: "2026-09-01", to: "2026-09-02" }, IST)
    ).toMatchObject({
      from: "2026-08-31T18:30:00.000Z",
      to: "2026-09-02T18:30:00.000Z",
    })
    expect(
      window({ range: "custom", from: "2026-10-01", to: "2026-10-31" }).to
    ).toBe("2026-10-06T12:00:00.000Z")
  })
})

describe("intervals", () => {
  it("defaults to hours for a day, days up to 90 days, months beyond", () => {
    expect(defaultInterval({ range: "24h", offset: 0 })).toBe("hour")
    expect(defaultInterval({ range: "90d", offset: 0 })).toBe("day")
    expect(defaultInterval({ range: "12mo", offset: 0 })).toBe("month")
  })

  it("allows hourly buckets only up to 31 days", () => {
    expect(allowedIntervals({ range: "30d", offset: 0 })).toContain("hour")
    expect(allowedIntervals({ range: "90d", offset: 0 })).toEqual([
      "day",
      "week",
      "month",
    ])
  })
})

describe("bucketStarts", () => {
  const sevenDays = resolveWindow({ range: "7d", offset: 0 }, 0, NOW)

  it("has one bucket per day, the last one running", () => {
    const starts = bucketStarts(sevenDays, "day").map(iso)
    expect(starts).toHaveLength(7)
    expect(starts[0]).toBe("2026-09-30T00:00:00.000Z")
    expect(starts[6]).toBe("2026-10-06T00:00:00.000Z")
  })

  it("starts weeks on Monday, including the one already under way", () => {
    expect(bucketStarts(sevenDays, "week").map(iso)).toEqual([
      "2026-09-28T00:00:00.000Z",
      "2026-10-05T00:00:00.000Z",
    ])
  })

  it("starts months on the 1st in the site's time zone", () => {
    const year = resolveWindow({ range: "12mo", offset: 0 }, IST, NOW)
    const starts = bucketStarts(year, "month").map(iso)
    expect(starts).toHaveLength(12)
    expect(starts[0]).toBe("2025-10-31T18:30:00.000Z")
    expect(starts[11]).toBe("2026-09-30T18:30:00.000Z")
  })
})
