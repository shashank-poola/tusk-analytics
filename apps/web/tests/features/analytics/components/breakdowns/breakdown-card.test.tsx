import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { parseBreakdownTabs } from "@/features/analytics/utils/analytics-params"
import {
  BreakdownBody,
  BreakdownCard,
} from "@/features/analytics/components/breakdowns/breakdown-card"

import { breakdown, SITE } from "@/tests/fixtures/analytics"

function renderBody(rows: number, by: "page" | "country" = "page") {
  return render(<BreakdownBody title="Pages" breakdown={breakdown(by, rows)} />)
}

describe("BreakdownBody", () => {
  it("shows the top 8 rows with visitors and pageviews", () => {
    renderBody(12)

    const top = screen.getByRole("list", { name: "Top pages" })
    const rows = within(top).getAllByRole("listitem")
    expect(rows).toHaveLength(8)
    expect(rows[0]).toHaveTextContent("/page-1")
    expect(rows[0]).toHaveTextContent("12 visitors, 36 pageviews")
  })

  it("opens every row in a Details dialog", async () => {
    renderBody(12)

    await userEvent.click(screen.getByRole("button", { name: /Details/ }))

    const dialog = screen.getByRole("dialog", { name: "Pages" })
    expect(dialog).toHaveAttribute("open")
    expect(
      within(dialog).getAllByRole("listitem", { hidden: true })
    ).toHaveLength(12)

    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }))
    expect(dialog).not.toHaveAttribute("open")
  })

  it("has no Details button when everything fits", () => {
    renderBody(8)

    expect(
      screen.queryByRole("button", { name: /Details/ })
    ).not.toBeInTheDocument()
  })

  it("shows countries with a flag and their full name", () => {
    const { container } = render(
      <BreakdownBody
        title="Countries"
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
    expect(
      container.querySelector('img[src="/icons/flags/in.svg"]')
    ).toBeInTheDocument()
    expect(
      container.querySelector('img[src="/icons/generic.svg"]')
    ).toBeInTheDocument()
    expect(screen.getByText("Unknown")).toBeInTheDocument()
  })

  it("renders tracker keys as text, never as markup", () => {
    const key = '<img src=x onerror="alert(1)">'
    const { container } = render(
      <BreakdownBody
        title="Pages"
        breakdown={{ by: "page", rows: [{ key, visitors: 1, pageviews: 1 }] }}
      />
    )

    expect(screen.getByText(key)).toBeInTheDocument()
    expect(container.querySelector("img")).not.toBeInTheDocument()
  })

  it("shows a No data pill when the range has no rows", () => {
    renderBody(0)

    expect(screen.getByText("No data")).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })
})

describe("BreakdownCard", () => {
  const tabs = parseBreakdownTabs({ sources: "referrer", devices: "os" })

  function renderCard(card: "sources" | "pages" = "sources") {
    return render(
      <BreakdownCard card={card} siteId={SITE.id} range="30d" tabs={tabs}>
        <p>Rows</p>
      </BreakdownCard>
    )
  }

  it("lists the card's tabs as links and marks the open one", () => {
    renderCard()

    const nav = screen.getByRole("navigation", { name: "sources breakdown" })
    const links = within(nav).getAllByRole("link")
    expect(links.map((link) => link.textContent)).toEqual([
      "Source",
      "Channel",
      "Referrer",
      "Campaign",
    ])
    expect(within(nav).getByRole("link", { name: "Referrer" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(
      within(nav).getByRole("link", { name: "Source" })
    ).not.toHaveAttribute("aria-current")
  })

  it("keeps the range and the other cards' tabs in each tab link", () => {
    renderCard()

    const href = screen
      .getByRole("link", { name: "Channel" })
      .getAttribute("href")
    const url = new URL(href ?? "", "http://x")
    expect(url.pathname).toBe(`/sites/${SITE.id}`)
    expect(Object.fromEntries(url.searchParams)).toEqual({
      range: "30d",
      sources: "channel",
      pages: "page",
      locations: "country",
      devices: "os",
    })
  })

  it("names the card after its open tab and renders its content", () => {
    renderCard()

    expect(screen.getByLabelText("Referrer")).toBeInTheDocument()
    expect(screen.getByText("Rows")).toBeInTheDocument()
  })

  it("shows the No data pill when its body is empty", () => {
    render(
      <BreakdownCard card="pages" siteId={SITE.id} range="7d" tabs={tabs}>
        <BreakdownBody title="Page" breakdown={breakdown("page", 0)} />
      </BreakdownCard>
    )

    expect(screen.getByText("No data")).toBeInTheDocument()
  })
})
