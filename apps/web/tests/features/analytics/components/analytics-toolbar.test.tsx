import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { parseBreakdownTabs } from "@/features/analytics/utils/analytics-params"
import { AnalyticsToolbar } from "@/features/analytics/components/analytics-toolbar"
import { SiteFavicon } from "@/features/sites/components/site-favicon"

import { SITE } from "@/tests/fixtures/analytics"

const tabs = parseBreakdownTabs({ pages: "exit_page", devices: "os" })

describe("AnalyticsToolbar", () => {
  function renderToolbar() {
    render(
      <AnalyticsToolbar site={SITE} sites={[SITE]} range="7d" tabs={tabs} />
    )
  }

  it("names the site and the current range", () => {
    renderToolbar()

    expect(screen.getAllByText("myapp.com")[0]).toBeInTheDocument()
    expect(screen.getByLabelText("Date range: Last 7 days")).toBeInTheDocument()
  })

  it("puts the site switcher in the site chip", () => {
    renderToolbar()

    expect(
      screen.getByLabelText("Switch site, current: myapp.com")
    ).toBeInTheDocument()
  })

  it("lists every range, marks the current one and keeps the open tabs", async () => {
    renderToolbar()
    await userEvent.click(screen.getByLabelText("Date range: Last 7 days"))

    const href = screen
      .getByRole("link", { name: /Last 30 days/ })
      .getAttribute("href")
    const url = new URL(href ?? "", "http://localhost")
    expect(url.pathname).toBe(`/sites/${SITE.id}`)
    expect(Object.fromEntries(url.searchParams)).toEqual({
      range: "30d",
      sources: "source",
      pages: "exit_page",
      locations: "country",
      devices: "os",
    })
    expect(screen.getAllByRole("link", { name: /^Last/ })).toHaveLength(4)
    expect(screen.getByRole("link", { name: /Last 7 days/ })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })
})

describe("SiteFavicon", () => {
  it("loads the favicon through the API", () => {
    const { container } = render(
      <SiteFavicon siteId={SITE.id} domain="myapp.com" />
    )

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      `/api/v1/sites/${SITE.id}/favicon`
    )
  })

  it("falls back to the first letter of the domain when the image fails", () => {
    const { container } = render(
      <SiteFavicon siteId={SITE.id} domain="myapp.com" />
    )
    const image = container.querySelector("img")
    if (!image) throw new Error("No favicon image")

    fireEvent.error(image)

    expect(container.querySelector("img")).not.toBeInTheDocument()
    expect(screen.getByText("m")).toBeInTheDocument()
  })
})
