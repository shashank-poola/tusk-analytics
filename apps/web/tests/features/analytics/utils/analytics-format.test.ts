import { describe, expect, it } from "vitest"

import {
  DEFAULT_PERIOD,
  parseFilters,
  parseInterval,
  parsePeriod,
  parseView,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import { parseBreakdownTabs } from "@/features/analytics/utils/breakdown-tabs"
import { tickLabel, tooltipLabel } from "@/features/analytics/utils/chart-axis"
import {
  countChange,
  formatCompact,
  formatDuration,
  formatNumber,
  formatPercent,
  formatTimeAgo,
} from "@/features/analytics/utils/format"
import { keyLabel } from "@/features/analytics/utils/labels"

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

describe("formatDuration", () => {
  it("shows seconds, minutes with seconds, then hours with minutes", () => {
    expect(formatDuration(42)).toBe("42s")
    expect(formatDuration(116)).toBe("1m 56s")
    expect(formatDuration(3725)).toBe("1h 2m")
  })

  it("rounds to whole seconds", () => {
    expect(formatDuration(0)).toBe("0s")
    expect(formatDuration(41.6)).toBe("42s")
  })
})

describe("formatTimeAgo", () => {
  const NOW = new Date("2026-10-06T12:00:00.000Z")
  const ago = (seconds: number) =>
    new Date(NOW.getTime() - seconds * 1000).toISOString()

  it("says just now for the last few seconds", () => {
    expect(formatTimeAgo(ago(10), NOW)).toBe("just now")
  })

  it("counts minutes, hours and days back", () => {
    expect(formatTimeAgo(ago(5 * 60), NOW)).toBe("5 minutes ago")
    expect(formatTimeAgo(ago(3 * 3600), NOW)).toBe("3 hours ago")
    expect(formatTimeAgo(ago(86_400), NOW)).toBe("yesterday")
    expect(formatTimeAgo(ago(3 * 86_400), NOW)).toBe("3 days ago")
  })
})

describe("change versus the previous period", () => {
  it("gives the size of a relative change and its direction", () => {
    expect(countChange(120, 100)).toEqual({ direction: "up", text: "20%" })
    expect(countChange(75, 100)).toEqual({ direction: "down", text: "25%" })
    expect(countChange(100, 100)).toEqual({ direction: "flat", text: "0%" })
  })

  it("counts a rise from 0 as 100% and 0 to 0 as flat", () => {
    expect(countChange(40, 0)).toEqual({ direction: "up", text: "100%" })
    expect(countChange(0, 0)).toEqual({ direction: "flat", text: "0%" })
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

  it("says what a missing referrer, campaign or channel means", () => {
    expect(keyLabel("referrer", null)).toBe("Direct/None")
    expect(keyLabel("campaign", null)).toBe("No campaign")
    expect(keyLabel("channel", null)).toBe("Unknown")
  })

  it("names channels and shows unknown ones as stored", () => {
    expect(keyLabel("channel", "search")).toBe("Organic search")
    expect(keyLabel("channel", "carrier-pigeon")).toBe("carrier-pigeon")
  })
})

describe("browser, os and source labels", () => {
  it("names the slugs ingest stores and shows unknown ones as stored", () => {
    expect(keyLabel("browser", "samsung-internet")).toBe("Samsung Internet")
    expect(keyLabel("os", "macos")).toBe("macOS")
    expect(keyLabel("browser", "yandex")).toBe("yandex")
  })

  it("names known sources from the shared referrer map", () => {
    expect(keyLabel("source", "hackernews")).toBe("Hacker News")
    expect(keyLabel("source", "direct")).toBe("Direct/None")
    expect(keyLabel("source", "blog.example.org")).toBe("blog.example.org")
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

  it("labels weeks by their Monday and months by name", () => {
    const monday = "2026-09-28T00:00:00.000+00:00"
    expect(tickLabel(monday, { interval: "week", points: 4 })).toBe("Sep 28")
    expect(tooltipLabel(monday, "week")).toBe("Week of Sep 28")
    expect(tickLabel(T, { interval: "month", points: 12 })).toBe("Oct")
    expect(tooltipLabel(T, "month")).toBe("October 2026")
  })
})

describe("search params", () => {
  it("reads a preset, its offset or a custom period, and falls back to 7 days", () => {
    expect(parsePeriod({ range: "30d" })).toEqual({ range: "30d", offset: 0 })
    expect(parsePeriod({ range: ["24h", "90d"], offset: "2" })).toEqual({
      range: "24h",
      offset: 2,
    })
    expect(
      parsePeriod({ range: "custom", from: "2026-09-01", to: "2026-09-30" })
    ).toEqual({ range: "custom", from: "2026-09-01", to: "2026-09-30" })
    expect(parsePeriod({ range: "1y" })).toEqual(DEFAULT_PERIOD)
    expect(parsePeriod({ range: "custom", from: "2026-09-30" })).toEqual(
      DEFAULT_PERIOD
    )
    expect(parsePeriod({})).toEqual({ range: "7d", offset: 0 })
  })

  it("keeps an interval the period allows and defaults otherwise", () => {
    expect(parseInterval("week", { range: "30d", offset: 0 })).toBe("week")
    expect(parseInterval("hour", { range: "90d", offset: 0 })).toBe("day")
    expect(parseInterval(undefined, { range: "today", offset: 0 })).toBe("hour")
  })

  it("writes short URLs and resets the interval for a period of another length", () => {
    const view = parseView({
      range: "30d",
      interval: "week",
      pages: "exit_link",
    })

    expect(viewSearch(view)).toEqual({
      range: "30d",
      interval: "week",
      pages: "exit_link",
    })
    expect(viewSearch(view, { period: { range: "7d", offset: 0 } })).toEqual({
      range: "7d",
      pages: "exit_link",
    })
    expect(viewSearch(view, { period: { range: "30d", offset: 1 } })).toEqual({
      range: "30d",
      offset: "1",
      interval: "week",
      pages: "exit_link",
    })
  })

  it("reads valid filters and drops the rest", () => {
    expect(
      parseFilters({
        country: "IN",
        page: ["/pricing", "/"],
        source: "",
        city: "x".repeat(1025),
        unknown: "1",
      })
    ).toEqual({ country: "IN", page: "/pricing" })
  })

  it("keeps at most 5 filters from the URL", () => {
    const filters = parseFilters({
      channel: "search",
      source: "google",
      campaign: "ref=x",
      hostname: "a.com",
      page: "/",
      country: "IN",
    })

    expect(Object.keys(filters)).toHaveLength(5)
    expect(filters.country).toBeUndefined()
  })

  it("keeps filters in every link", () => {
    const view = parseView({ range: "7d", country: "IN" })

    expect(viewSearch(view, { tabs: { ...view.tabs, devices: "os" } })).toEqual(
      {
        range: "7d",
        country: "IN",
        devices: "os",
      }
    )
  })

  it("defaults each card to DataFast's tab", () => {
    expect(parseBreakdownTabs({})).toEqual({
      sources: "referrer",
      pages: "page",
      locations: "map",
      devices: "browser",
    })
  })

  it("reads each card's tab from its own param", () => {
    expect(
      parseBreakdownTabs({ sources: "campaign", devices: ["os", "device"] })
    ).toEqual({
      sources: "campaign",
      pages: "page",
      locations: "map",
      devices: "os",
    })
  })

  it("ignores a tab that belongs to another card", () => {
    expect(parseBreakdownTabs({ sources: "country" }).sources).toBe("referrer")
  })
})
