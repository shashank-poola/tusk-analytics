import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { KpiStrip } from "@/features/analytics/components/overview/kpi-strip"

import { NO_TOTALS, overview, SITE } from "@/tests/fixtures/analytics"

vi.mock("@/features/analytics/server/live-visitors-action", () => ({
  checkLiveVisitors: vi.fn(),
}))

const CURRENT = {
  visitors: 1200,
  pageviews: 3400,
  sessions: 80,
  bounceRate: 0.44,
  avgSessionSeconds: 116,
}
const PREVIOUS = {
  visitors: 1000,
  pageviews: 3400,
  sessions: 50,
  bounceRate: 0.4,
  avgSessionSeconds: 100,
}

function renderStrip(current = CURRENT, previous = PREVIOUS, live = 3) {
  render(
    <KpiStrip
      siteId={SITE.id}
      overview={overview(current, previous)}
      liveVisitors={live}
    />
  )
}

function item(name: RegExp) {
  const found = screen.getByRole("heading", { name }).closest("li")
  if (!found) throw new Error(`No item for ${name}`)
  return found
}

function metric(name: RegExp) {
  return within(item(name))
}

describe("KpiStrip", () => {
  it("shows the five metrics", () => {
    renderStrip()

    expect(screen.getAllByRole("listitem")).toHaveLength(5)
    expect(metric(/^Visitors/).getAllByText("1.2K")).not.toHaveLength(0)
    expect(metric(/^Pageviews/).getAllByText("3.4K")).not.toHaveLength(0)
    expect(metric(/^Bounce rate/).getAllByText("44%")).not.toHaveLength(0)
    expect(item(/^Online/)).toHaveTextContent("3visitors on the site right now")
  })

  it("formats session time as minutes and seconds", () => {
    renderStrip()

    expect(metric(/^Session time/).getAllByText("1m 56s")).not.toHaveLength(0)
  })

  it("says what the live count means for screen readers", () => {
    renderStrip(CURRENT, PREVIOUS, 1)

    expect(
      metric(/^Online/).getByText("visitor on the site right now")
    ).toBeInTheDocument()
  })

  it("shows each change versus the previous period", () => {
    renderStrip()

    expect(item(/^Visitors/)).toHaveTextContent(
      "up 20% versus the previous period"
    )
    expect(item(/^Pageviews/)).toHaveTextContent(
      "unchanged at 0% versus the previous period"
    )
    expect(item(/^Session time/)).toHaveTextContent(
      "up 16% versus the previous period"
    )
  })

  it("gives the bounce rate change relative to the previous rate", () => {
    renderStrip()

    expect(item(/^Bounce rate/)).toHaveTextContent(
      "up 10% versus the previous period"
    )
  })

  it("shows zeros and the fall when the period has no pageviews", () => {
    renderStrip(NO_TOTALS, PREVIOUS, 0)

    expect(metric(/^Visitors/).getAllByText("0")).not.toHaveLength(0)
    expect(item(/^Visitors/)).toHaveTextContent(
      "down 100% versus the previous period"
    )
  })

  it("counts any number after an empty previous period as up 100%", () => {
    renderStrip(CURRENT, NO_TOTALS)

    expect(item(/^Visitors/)).toHaveTextContent(
      "up 100% versus the previous period"
    )
    expect(screen.queryByText("–")).not.toBeInTheDocument()
  })

  it("has no info buttons next to the labels", () => {
    renderStrip()

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
