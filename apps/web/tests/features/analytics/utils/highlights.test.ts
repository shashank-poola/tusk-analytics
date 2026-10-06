import type { StatsTotals } from "@workspace/contracts"
import { describe, expect, it } from "vitest"

import { buildHighlights } from "@/features/analytics/utils/highlights"

function totals(visitors: number, pageviews = visitors, sessions = visitors) {
  return {
    visitors,
    pageviews,
    sessions,
    bounceRate: 0.5,
    avgSessionSeconds: 60,
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
