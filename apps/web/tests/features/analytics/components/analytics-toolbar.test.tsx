import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"

import { parseView } from "@/features/analytics/utils/analytics-params"
import { AnalyticsToolbar } from "@/features/analytics/components/analytics-toolbar"
import { SiteFavicon } from "@/features/sites/components/site-favicon"

import { SITE } from "@/tests/fixtures/analytics"

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}))
// next/form needs the app router; a plain GET form behaves the same here.
vi.mock("next/form", () => ({
  default: ({
    scroll: _scroll,
    ...props
  }: ComponentProps<"form"> & { scroll?: boolean }) => <form {...props} />,
}))

function withoutViewMarker(url: URL) {
  const { view, ...search } = Object.fromEntries(url.searchParams)
  expect(view).toBe("1")
  return search
}

describe("AnalyticsToolbar", () => {
  /** Tuesday 2026-10-06, 21:38 UTC. */
  const NOW = new Date("2026-10-06T21:38:00.000Z")

  function renderToolbar(search: Record<string, string> = { range: "30d" }) {
    render(
      <AnalyticsToolbar
        site={SITE}
        sites={[SITE]}
        view={parseView({ ...search, pages: "exit_link" })}
        now={NOW}
      />
    )
  }

  /** What a link sets; the proxy keeps it in a cookie, not the URL. */
  function query(link: HTMLElement) {
    const url = new URL(link.getAttribute("href") ?? "", "http://localhost")
    return withoutViewMarker(url)
  }

  it("shows the site, the period, the interval and refresh in one row", () => {
    renderToolbar()

    expect(
      screen.getByLabelText("Switch site, current: myapp.com")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Period: Last 30 days")).toBeInTheDocument()
    expect(screen.getByLabelText("Chart interval: Daily")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument()
  })

  it("steps back a whole period and can't step past now", () => {
    renderToolbar()

    expect(
      query(screen.getByRole("link", { name: "Previous period" }))
    ).toEqual({ range: "30d", offset: "1", pages: "exit_link" })
    expect(
      screen.queryByRole("link", { name: "Next period" })
    ).not.toBeInTheDocument()
  })

  it("steps forward from an earlier period", () => {
    renderToolbar({ range: "30d", offset: "1" })

    expect(screen.getByLabelText("Period: Aug 8 – Sep 6")).toBeInTheDocument()
    expect(query(screen.getByRole("link", { name: "Next period" }))).toEqual({
      range: "30d",
      pages: "exit_link",
    })
  })

  it("lists presets with key hints, marks the current one and keeps the tabs", async () => {
    renderToolbar()
    await userEvent.click(screen.getByLabelText("Period: Last 30 days"))

    expect(screen.getByText("9:38 PM")).toBeInTheDocument()
    const yesterday = screen.getByRole("link", { name: /Yesterday/ })
    expect(query(yesterday)).toEqual({
      range: "today",
      offset: "1",
      pages: "exit_link",
    })
    expect(yesterday).toHaveAttribute("aria-keyshortcuts", "Y")
    expect(screen.getByRole("link", { name: /Last 30 days/ })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("picks a custom range on a two-month calendar, never past today", async () => {
    renderToolbar()
    await userEvent.click(screen.getByLabelText("Period: Last 30 days"))
    await userEvent.click(screen.getByRole("button", { name: "Custom" }))

    expect(
      screen.getByRole("region", { name: "September 2026" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "October 2026" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Wednesday, October 7, 2026" })
    ).toBeDisabled()
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled()

    await userEvent.click(
      screen.getByRole("button", { name: "Saturday, October 3, 2026" })
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Monday, September 28, 2026" })
    )
    expect(screen.getByLabelText("Start")).toHaveValue("2026-09-28")
    expect(screen.getByLabelText("End")).toHaveValue("2026-10-03")
    await userEvent.click(screen.getByRole("button", { name: "Apply" }))

    const url = new URL(push.mock.calls.at(-1)?.[0] ?? "", "http://x")
    expect(withoutViewMarker(url)).toEqual({
      pages: "exit_link",
      range: "custom",
      from: "2026-09-28",
      to: "2026-10-03",
    })
  })

  it("toggles the comparison with the previous period", () => {
    renderToolbar({ range: "today" })

    const toggle = screen.getByRole("link", { name: "vs Yesterday, off" })
    expect(query(toggle)).toMatchObject({ range: "today", compare: "1" })
  })

  it("turns off hourly buckets when the period is too long", async () => {
    renderToolbar({ range: "90d" })
    await userEvent.click(screen.getByLabelText("Chart interval: Daily"))

    expect(
      screen.queryByRole("link", { name: "Hourly" })
    ).not.toBeInTheDocument()
    expect(query(screen.getByRole("link", { name: "Weekly" }))).toEqual({
      range: "90d",
      interval: "week",
      pages: "exit_link",
    })
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
