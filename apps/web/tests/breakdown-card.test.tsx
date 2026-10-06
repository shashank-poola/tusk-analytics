import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { BreakdownBody } from "@/features/analytics/breakdown-card"

import { breakdown, SITE } from "./fixtures/analytics"

function renderBody(rows: number, by: "page" | "country" = "page") {
  return render(
    <BreakdownBody
      title="Pages"
      siteId={SITE.id}
      range="7d"
      breakdown={breakdown(by, rows)}
    />
  )
}

describe("BreakdownBody", () => {
  it("shows the top 5 rows with visitors and pageviews", () => {
    renderBody(12)

    const top = screen.getByRole("list", { name: "Top pages" })
    const rows = within(top).getAllByRole("listitem")
    expect(rows).toHaveLength(5)
    expect(rows[0]).toHaveTextContent("/page-1")
    expect(rows[0]).toHaveTextContent("12 visitors, 36 pageviews")
  })

  it("opens every row, up to 50, in a View all dialog", async () => {
    renderBody(12)

    await userEvent.click(screen.getByRole("button", { name: "View all 12" }))

    const dialog = screen.getByRole("dialog", { name: "Pages" })
    expect(dialog).toHaveAttribute("open")
    expect(
      within(dialog).getAllByRole("listitem", { hidden: true })
    ).toHaveLength(12)

    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }))
    expect(dialog).not.toHaveAttribute("open")
  })

  it("has no View all when everything fits", () => {
    renderBody(4)

    expect(
      screen.queryByRole("button", { name: /View all/ })
    ).not.toBeInTheDocument()
  })

  it("shows countries with a flag and their full name", () => {
    render(
      <BreakdownBody
        title="Countries"
        siteId={SITE.id}
        range="7d"
        breakdown={{
          by: "country",
          rows: [
            { key: "IN", visitors: 3, pageviews: 4 },
            { key: null, visitors: 1, pageviews: 1 },
          ],
        }}
      />
    )

    expect(screen.getByText("India")).toBeInTheDocument()
    expect(screen.getByText("🇮🇳")).toBeInTheDocument()
    expect(screen.getByText("Unknown")).toBeInTheDocument()
  })

  it("renders tracker keys as text, never as markup", () => {
    const key = '<img src=x onerror="alert(1)">'
    const { container } = render(
      <BreakdownBody
        title="Pages"
        siteId={SITE.id}
        range="7d"
        breakdown={{ by: "page", rows: [{ key, visitors: 1, pageviews: 1 }] }}
      />
    )

    expect(screen.getByText(key)).toBeInTheDocument()
    expect(container.querySelector("img")).not.toBeInTheDocument()
  })

  it("shows a quiet empty state without a link when the range has no rows", () => {
    renderBody(0)

    expect(screen.getByText("No visits in this period")).toBeInTheDocument()
    // The chart's empty state offers the next step, once per page.
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
