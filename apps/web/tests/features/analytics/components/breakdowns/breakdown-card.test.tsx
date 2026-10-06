import type { StatsBreakdownResponse } from "@workspace/contracts"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { parseView } from "@/features/analytics/utils/analytics-params"
import { BreakdownBody } from "@/features/analytics/components/breakdowns/breakdown-body"
import { BreakdownCard } from "@/features/analytics/components/breakdowns/breakdown-card"

import { breakdown, SITE } from "@/tests/fixtures/analytics"

type Row = StatsBreakdownResponse["rows"][number]

/** The rows shown in the card, not the copy in the Details dialog. */
const top = () => within(screen.getByRole("list", { name: /^Top/ }))

const filterHref = (row: Row) => (row.key ? `/filter?key=${row.key}` : null)

function renderBody(
  data: StatsBreakdownResponse,
  title = "Pages",
  hrefFor = filterHref
) {
  return render(
    <BreakdownBody title={title} breakdown={data} hrefFor={hrefFor} />
  )
}

describe("BreakdownBody", () => {
  it("shows the top 10 rows with visitors and pageviews", () => {
    renderBody(breakdown("page", 12))

    const top = screen.getByRole("list", { name: "Top pages" })
    const rows = within(top).getAllByRole("listitem")
    expect(rows).toHaveLength(10)
    expect(rows[0]).toHaveTextContent("/page-1")
    expect(rows[0]).toHaveTextContent("12 visitors, 36 pageviews")
  })

  it("filters the dashboard when a row is clicked, except unknown rows", () => {
    renderBody({
      by: "page",
      rows: [
        { key: "/pricing", visitors: 3, pageviews: 4 },
        { key: null, visitors: 1, pageviews: 1 },
      ],
    })

    expect(top().getByRole("link", { name: /\/pricing/ })).toHaveAttribute(
      "href",
      "/filter?key=/pricing"
    )
    expect(top().getAllByRole("link")).toHaveLength(1)
  })

  it("lists every row in the Details dialog as a table, with a search", async () => {
    renderBody(breakdown("page", 12))

    await userEvent.click(screen.getByRole("button", { name: /Details/ }))

    const dialog = screen.getByRole("dialog", { name: "Pages" })
    expect(dialog).toHaveAttribute("open")
    const table = within(dialog).getByRole("table")
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent)
    ).toEqual(["Pages", "Visitors"])
    // A header row plus one row per page.
    expect(within(table).getAllByRole("row")).toHaveLength(13)

    await userEvent.type(
      within(dialog).getByLabelText("Search pages"),
      "page-12"
    )
    const visible = within(table)
      .getAllByRole("row")
      .filter((row) => row.closest("tbody") && !row.hidden)
    expect(visible).toHaveLength(1)
    expect(visible[0]).toHaveTextContent("/page-12")

    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }))
    expect(dialog).not.toHaveAttribute("open")
  })

  it("filters the dashboard from a row of the Details table", async () => {
    renderBody(breakdown("page", 3))

    await userEvent.click(screen.getByRole("button", { name: /Details/ }))

    const table = within(
      screen.getByRole("dialog", { name: "Pages" })
    ).getByRole("table")
    expect(
      within(table).getByRole("link", { name: "/page-2" })
    ).toHaveAttribute("href", "/filter?key=/page-2")
  })

  it("shows countries with a flag and their full name", () => {
    const { container } = renderBody(
      {
        by: "country",
        rows: [
          { key: "IN", visitors: 3, pageviews: 4 },
          { key: null, visitors: 1, pageviews: 1 },
        ],
      },
      "Countries"
    )

    expect(top().getByText("India")).toBeInTheDocument()
    expect(
      container.querySelector('img[src="/icons/flags/in.svg"]')
    ).toBeInTheDocument()
    expect(top().getByText("Unknown")).toBeInTheDocument()
  })

  it("dims a campaign's parameter names and shows its values decoded", () => {
    renderBody(
      {
        by: "campaign",
        rows: [
          {
            key: "utm_source=x&utm_campaign=launch%26more",
            visitors: 2,
            pageviews: 2,
          },
        ],
      },
      "Campaign"
    )

    const label = top().getByTitle("?utm_source=x&utm_campaign=launch&more")
    expect(within(label).getByText("?utm_source=")).toHaveClass(
      "text-muted-foreground"
    )
    expect(label).toHaveTextContent("?utm_source=x&utm_campaign=launch&more")
  })

  it("shows an exit link with its site's icon and clicks for screen readers", () => {
    const { container } = renderBody(
      {
        by: "exit_link",
        rows: [{ key: "github.com/acme", visitors: 2, pageviews: 3 }],
      },
      "Exit link"
    )

    expect(top().getByText("github.com/acme")).toBeInTheDocument()
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/icons/referrers/github.svg"
    )
    expect(top().getByText(/2 visitors, 3 clicks/)).toBeInTheDocument()
  })

  it("renders tracker keys as text, never as markup", () => {
    const key = '<img src=x onerror="alert(1)">'
    const { container } = renderBody({
      by: "page",
      rows: [{ key, visitors: 1, pageviews: 1 }],
    })

    expect(top().getByText(key)).toBeInTheDocument()
    expect(container.querySelector("img")).not.toBeInTheDocument()
  })

  it("shows a No data pill when the period has no rows", () => {
    renderBody(breakdown("page", 0))

    expect(screen.getByText("No data")).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })
})

describe("BreakdownCard", () => {
  const view = parseView({
    range: "30d",
    sources: "campaign",
    devices: "os",
    country: "IN",
  })

  function renderCard(card: "sources" | "locations" = "sources") {
    return render(
      <BreakdownCard card={card} siteId={SITE.id} view={view}>
        <p>Rows</p>
      </BreakdownCard>
    )
  }

  it("lists DataFast's tabs as links and marks the open one", () => {
    renderCard()

    const nav = screen.getByRole("navigation", { name: "sources breakdown" })
    const links = within(nav).getAllByRole("link")
    expect(links.map((link) => link.textContent)).toEqual([
      "Channel",
      "Referrer",
      "Campaign",
    ])
    expect(within(nav).getByRole("link", { name: "Campaign" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("keeps the period, filters and other cards' tabs in each tab link", () => {
    renderCard()

    const href = screen
      .getByRole("link", { name: "Channel" })
      .getAttribute("href")
    const url = new URL(href ?? "", "http://x")
    expect(url.pathname).toBe(`/site/${SITE.id}`)
    expect(Object.fromEntries(url.searchParams)).toEqual({
      view: "1",
      range: "30d",
      country: "IN",
      sources: "channel",
      devices: "os",
    })
  })

  it("leaves the default tab out of the URL", () => {
    renderCard()

    const href = screen
      .getByRole("link", { name: "Referrer" })
      .getAttribute("href")
    expect(href).not.toContain("sources=")
  })

  it("says rows are sorted by visitors, but not over the map", () => {
    renderCard()
    expect(screen.getByText(/Visitors/)).toBeInTheDocument()
  })

  it("names the card after its open tab and renders its content", () => {
    renderCard("locations")

    expect(screen.getByLabelText("Map")).toBeInTheDocument()
    expect(screen.getByText("Rows")).toBeInTheDocument()
    expect(screen.queryByText(/Visitors/)).not.toBeInTheDocument()
  })
})
