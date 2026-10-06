import type { StatsTotals } from "@workspace/contracts"
import { describe, expect, it } from "vitest"

import {
  greetingDetail,
  greetingHeadline,
} from "@/features/analytics/greeting-text"
import { buildHighlights } from "@/features/analytics/highlights"

function totals(visitors: number, pageviews = visitors, sessions = visitors) {
  return {
    visitors,
    pageviews,
    sessions,
    bounceRate: 0.5,
  } satisfies StatsTotals
}

const row = (key: string | null, visitors: number) => ({
  key,
  visitors,
  pageviews: visitors * 2,
})

const BASE = {
  range: "7d" as const,
  current: totals(100),
  previous: totals(100),
  sources: [],
  pages: [],
}

const kinds = (input: Parameters<typeof buildHighlights>[0]) =>
  buildHighlights(input).map((highlight) => highlight.kind)

describe("buildHighlights", () => {
  it("names the best source by visitors", () => {
    const [highlight] = buildHighlights({
      ...BASE,
      sources: [row("hackernews", 42), row("google", 30)],
    })
    expect(highlight).toEqual({
      kind: "source",
      text: "Hacker News sent 42 visitors, your best source.",
    })
  })

  it("words direct traffic as coming directly", () => {
    const [highlight] = buildHighlights({
      ...BASE,
      sources: [row("direct", 1), row("x", 0)],
    })
    expect(highlight?.text).toBe(
      "1 visitor came directly, more than from any other source."
    )
  })

  it("names the top page", () => {
    const [highlight] = buildHighlights({
      ...BASE,
      pages: [row("/pricing", 120), row("/", 80)],
    })
    expect(highlight).toEqual({
      kind: "page",
      text: "/pricing was your top page, seen by 120 visitors.",
    })
  })

  it("calls / the home page", () => {
    const [highlight] = buildHighlights({
      ...BASE,
      pages: [row("/", 9), row("/docs", 2)],
    })
    expect(highlight?.text).toBe(
      "Your home page was the top page, seen by 9 visitors."
    )
  })

  it.each([
    ["only one row", [row("google", 10)]],
    ["a tie for first", [row("google", 10), row("x", 10)]],
    ["an unknown top key", [row(null, 10), row("x", 5)]],
    ["no visitors", [row("google", 0), row("x", 0)]],
  ])("hides the source and page sentences with %s", (_, rows) => {
    expect(kinds({ ...BASE, sources: rows, pages: rows })).toEqual([])
  })

  it("names the biggest change of visitors, pageviews and sessions", () => {
    const [highlight] = buildHighlights({
      ...BASE,
      current: totals(110, 134, 90),
      previous: totals(100, 100, 100),
    })
    expect(highlight).toEqual({
      kind: "change",
      text: "Pageviews are up 34% on the previous 7 days.",
    })
  })

  it("says down for a drop", () => {
    const [highlight] = buildHighlights({
      ...BASE,
      current: totals(60),
      previous: totals(100),
    })
    expect(highlight?.text).toBe(
      "Visitors are down 40% on the previous 7 days."
    )
  })

  it("hides the change sentence when changes are small or there's no previous period", () => {
    expect(
      kinds({ ...BASE, current: totals(103), previous: totals(100) })
    ).toEqual([])
    expect(
      kinds({ ...BASE, current: totals(50), previous: totals(0) })
    ).toEqual([])
  })

  it("returns all three sentences in a fixed order", () => {
    expect(
      kinds({
        ...BASE,
        current: totals(200),
        sources: [row("google", 3), row("x", 1)],
        pages: [row("/", 3), row("/docs", 2)],
      })
    ).toEqual(["source", "page", "change"])
  })
})

describe("greeting", () => {
  const visited = { domain: "myapp.com", range: "7d" as const }

  it("greets by first name and counts people", () => {
    expect(
      greetingHeadline({ ...visited, name: "Ada Lovelace", visitors: 1204 })
    ).toBe("Hey Ada, 1,204 people visited myapp.com in the last 7 days.")
    expect(greetingHeadline({ ...visited, name: "", visitors: 1 })).toBe(
      "Hey there, 1 person visited myapp.com in the last 7 days."
    )
    expect(greetingHeadline({ ...visited, name: null, visitors: 0 })).toBe(
      "Hey there, myapp.com had no visitors in the last 7 days."
    )
  })

  it("compares visitors with the previous period in one line", () => {
    expect(greetingDetail("24h", totals(118), totals(100))).toBe(
      "That's 18% more than the previous 24 hours."
    )
    expect(greetingDetail("7d", totals(50), totals(100))).toBe(
      "That's 50% fewer than the previous 7 days."
    )
    expect(greetingDetail("7d", totals(1000), totals(1004))).toBe(
      "About the same as the previous 7 days."
    )
    expect(greetingDetail("30d", totals(5), totals(0))).toBe(
      "Nobody visited in the previous 30 days, so there's nothing to compare yet."
    )
  })
})
