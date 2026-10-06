import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DeviceTabs } from "@/features/analytics/device-tabs"
import { RangePicker } from "@/features/analytics/range-picker"

import { SITE } from "./fixtures/analytics"

describe("RangePicker", () => {
  it("links each range and keeps the devices tab", () => {
    render(<RangePicker siteId={SITE.id} range="7d" tab="browser" />)

    const links = screen.getAllByRole("link")

    expect(links.map((link) => link.textContent)).toEqual([
      "24h",
      "7d",
      "30d",
      "90d",
    ])
    expect(
      screen.getByRole("link", { name: "the last 24 hours" })
    ).toHaveAttribute("href", `/sites/${SITE.id}?range=24h&tab=browser`)
    expect(
      screen.getByRole("link", { name: "the last 90 days" })
    ).toHaveAttribute("href", `/sites/${SITE.id}?range=90d&tab=browser`)
  })

  it("marks only the current range", () => {
    render(<RangePicker siteId={SITE.id} range="30d" tab="device" />)

    expect(
      screen.getByRole("link", { name: "the last 30 days" })
    ).toHaveAttribute("aria-current", "page")
    expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1)
  })
})

describe("DeviceTabs", () => {
  it("links each tab and keeps the range", () => {
    render(<DeviceTabs siteId={SITE.id} range="30d" active="device" />)

    expect(screen.getByRole("link", { name: "Device" })).toHaveAttribute(
      "href",
      `/sites/${SITE.id}?range=30d&tab=device`
    )
    expect(screen.getByRole("link", { name: "Browser" })).toHaveAttribute(
      "href",
      `/sites/${SITE.id}?range=30d&tab=browser`
    )
    expect(screen.getByRole("link", { name: "OS" })).toHaveAttribute(
      "href",
      `/sites/${SITE.id}?range=30d&tab=os`
    )
  })

  it("marks only the active tab", () => {
    render(<DeviceTabs siteId={SITE.id} range="7d" active="os" />)

    expect(screen.getByRole("link", { name: "OS" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1)
  })
})
