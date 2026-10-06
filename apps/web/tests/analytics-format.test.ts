import { describe, expect, it } from "vitest"

import {
  DEFAULT_RANGE,
  DEFAULT_TAB,
  parseRange,
  parseTab,
} from "@/features/analytics/analytics-params"
import {
  bounceRateChange,
  bucketLabel,
  countChange,
  countryName,
  formatCompact,
  formatPercent,
} from "@/features/analytics/format"

describe("number formatting", () => {
  it("formats counts compactly", () => {
    expect(formatCompact(950)).toBe("950")
    expect(formatCompact(1234)).toBe("1.2K")
    expect(formatCompact(2_500_000)).toBe("2.5M")
  })

  it("formats a bounce rate as a whole percentage", () => {
    expect(formatPercent(0.4567)).toBe("46%")
    expect(formatPercent(0)).toBe("0%")
  })
})

describe("change versus the previous period", () => {
  it("gives a signed relative change and its direction", () => {
    expect(countChange(120, 100)).toEqual({ direction: "up", text: "+20%" })
    expect(countChange(75, 100)).toEqual({ direction: "down", text: "-25%" })
    expect(countChange(100, 100)).toEqual({ direction: "flat", text: "0%" })
  })

  it("has no change when the previous value is 0", () => {
    expect(countChange(40, 0)).toEqual({ direction: "none" })
  })

  it("gives bounce rate changes in percentage points", () => {
    expect(bounceRateChange(0.44, 0.4, 10)).toEqual({
      direction: "up",
      text: "+4 pts",
    })
    expect(bounceRateChange(0.35, 0.4, 10)).toEqual({
      direction: "down",
      text: "-5 pts",
    })
  })

  it("has no bounce rate change when the previous period had no sessions", () => {
    expect(bounceRateChange(0.5, 0, 0)).toEqual({ direction: "none" })
  })
})

describe("labels", () => {
  it("names countries in full and says Unknown when missing", () => {
    expect(countryName("IN")).toBe("India")
    expect(countryName("GB")).toBe("United Kingdom")
    expect(countryName(null)).toBe("Unknown")
  })

  it("labels buckets in the site's local time, from the offset in t", () => {
    expect(bucketLabel("2026-10-05T00:00:00.000+05:30", "day")).toBe("Oct 5")
    expect(bucketLabel("2026-10-05T14:00:00.000-07:00", "hour")).toBe("14:00")
  })
})

describe("search params", () => {
  it("reads a known range and falls back to 7d otherwise", () => {
    expect(parseRange("30d")).toBe("30d")
    expect(parseRange(["24h", "90d"])).toBe("24h")
    expect(parseRange("1y")).toBe(DEFAULT_RANGE)
    expect(parseRange(undefined)).toBe("7d")
  })

  it("reads a known tab and falls back to sources otherwise", () => {
    expect(parseTab("browser")).toBe("browser")
    expect(parseTab("path")).toBe(DEFAULT_TAB)
    expect(parseTab(undefined)).toBe("source")
  })
})
