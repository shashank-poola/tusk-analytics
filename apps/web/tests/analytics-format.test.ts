import { describe, expect, it } from "vitest"

import {
  DEFAULT_DEVICE_TAB,
  DEFAULT_RANGE,
  parseDeviceTab,
  parseRange,
} from "@/features/analytics/analytics-params"
import { tickLabel, tooltipLabel } from "@/features/analytics/chart-axis"
import {
  bounceRateChange,
  countChange,
  formatCompact,
  formatNumber,
  formatPercent,
} from "@/features/analytics/format"
import { countryFlag, keyLabel } from "@/features/analytics/labels"

describe("number formatting", () => {
  it("formats counts compactly for cards and in full for sentences", () => {
    expect(formatCompact(950)).toBe("950")
    expect(formatCompact(1234)).toBe("1.2K")
    expect(formatCompact(2_500_000)).toBe("2.5M")
    expect(formatNumber(1234)).toBe("1,234")
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
    expect(bounceRateChange(0.355, 0.4, 10)).toEqual({
      direction: "down",
      text: "-4.5 pts",
    })
  })

  it("has no bounce rate change when the previous period had no sessions", () => {
    expect(bounceRateChange(0.5, 0, 0)).toEqual({ direction: "none" })
  })
})

describe("breakdown labels", () => {
  it("names known sources and shows unknown ones as stored", () => {
    expect(keyLabel("source", "hackernews")).toBe("Hacker News")
    expect(keyLabel("source", "news.example.com")).toBe("news.example.com")
    expect(keyLabel("source", null)).toBe("Unknown")
  })

  it("names countries in full and says Unknown when missing", () => {
    expect(keyLabel("country", "IN")).toBe("India")
    expect(keyLabel("country", "GB")).toBe("United Kingdom")
    expect(keyLabel("country", null)).toBe("Unknown")
  })

  it("builds a flag emoji from a two-letter code, and nothing otherwise", () => {
    expect(countryFlag("IN")).toBe("🇮🇳")
    expect(countryFlag(null)).toBeNull()
    expect(countryFlag("XYZ")).toBeNull()
  })
})

describe("chart labels", () => {
  const T = "2026-10-06T14:00:00.000+05:30"

  it("labels hours by time, a week by weekday and longer ranges by date", () => {
    expect(tickLabel(T, { interval: "hour", points: 24 })).toBe("14:00")
    expect(tickLabel(T, { interval: "day", points: 7 })).toBe("Tue 6")
    expect(tickLabel(T, { interval: "day", points: 30 })).toBe("Oct 6")
  })

  it("reads the local date from t without shifting time zones", () => {
    expect(tooltipLabel("2026-10-05T00:00:00.000+05:30", "day")).toBe(
      "Mon, Oct 5"
    )
    expect(tooltipLabel(T, "hour")).toBe("Tue, Oct 6, 14:00")
  })
})

describe("search params", () => {
  it("reads a known range and falls back to 7d otherwise", () => {
    expect(parseRange("30d")).toBe("30d")
    expect(parseRange(["24h", "90d"])).toBe("24h")
    expect(parseRange("1y")).toBe(DEFAULT_RANGE)
    expect(parseRange(undefined)).toBe("7d")
  })

  it("reads the Devices sub-tab and falls back to device otherwise", () => {
    expect(parseDeviceTab("browser")).toBe("browser")
    expect(parseDeviceTab("source")).toBe(DEFAULT_DEVICE_TAB)
    expect(parseDeviceTab(undefined)).toBe("device")
  })
})
