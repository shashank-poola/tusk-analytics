import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { KpiCards } from "@/features/analytics/kpi-cards"

import { NO_TOTALS, overview } from "./fixtures/analytics"

const TIMESERIES = {
  interval: "day" as const,
  points: [
    { t: "2026-10-05T00:00:00.000+00:00", visitors: 3, pageviews: 5 },
    { t: "2026-10-06T00:00:00.000+00:00", visitors: 9, pageviews: 12 },
  ],
}

function card(label: string) {
  const heading = screen.getByRole("heading", { name: new RegExp(label) })
  const element = heading.closest("section")
  if (!element) throw new Error(`No card for ${label}`)
  return within(element)
}

describe("KpiCards", () => {
  it("shows each number with its change as an arrow, a sign and words", () => {
    render(
      <KpiCards
        overview={overview(
          { visitors: 1200, pageviews: 3000, sessions: 1500, bounceRate: 0.44 },
          { visitors: 1000, pageviews: 4000, sessions: 1500, bounceRate: 0.4 }
        )}
        timeseries={TIMESERIES}
      />
    )

    expect(
      card("Visitors").getByText("1.2K", { selector: ".sr-only" })
    ).toBeInTheDocument()
    expect(card("Visitors").getByText(/\+20%/)).toHaveTextContent(
      "+20% versus the previous period"
    )
    expect(card("Pageviews").getByText(/-25%/)).toBeInTheDocument()
    expect(card("Sessions").getByText(/0%/)).toBeInTheDocument()
    expect(card("Bounce rate").getByText(/\+4 pts/)).toBeInTheDocument()
  })

  it("marks a rising bounce rate as bad news and a rising count as good", () => {
    render(
      <KpiCards
        overview={overview(
          { visitors: 20, pageviews: 30, sessions: 25, bounceRate: 0.6 },
          { visitors: 10, pageviews: 30, sessions: 25, bounceRate: 0.4 }
        )}
        timeseries={TIMESERIES}
      />
    )

    expect(card("Visitors").getByText(/\+100%/)).toHaveClass("text-positive")
    expect(card("Bounce rate").getByText(/\+20 pts/)).toHaveClass(
      "text-negative"
    )
  })

  it("shows – when there's no previous value", () => {
    render(
      <KpiCards
        overview={overview({
          visitors: 5,
          pageviews: 9,
          sessions: 6,
          bounceRate: 0.5,
        })}
        timeseries={TIMESERIES}
      />
    )

    for (const label of ["Visitors", "Pageviews", "Sessions", "Bounce rate"]) {
      expect(
        card(label).getByText("No data for the previous period")
      ).toBeInTheDocument()
    }
  })

  it("explains each metric on focus", async () => {
    render(<KpiCards overview={overview(NO_TOTALS)} timeseries={TIMESERIES} />)

    const info = screen.getByRole("button", { name: "About bounce rate" })
    await userEvent.tab()
    info.focus()

    expect(info).toHaveAccessibleDescription(/only one page/)
  })
})
