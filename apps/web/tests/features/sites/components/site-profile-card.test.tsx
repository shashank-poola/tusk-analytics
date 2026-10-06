import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SiteProfileCard } from "@/features/sites/components/site-profile-card"

import { SITE } from "@/tests/fixtures/analytics"

describe("SiteProfileCard", () => {
  it("shows the site like a profile: name, domain, since when, and its numbers", () => {
    render(<SiteProfileCard site={SITE} stats={<p>1.2K Visitors</p>} />)

    expect(screen.getByRole("heading", { name: "My app" })).toBeInTheDocument()
    expect(screen.getByText("myapp.com")).toBeInTheDocument()
    expect(
      screen.getByText("Tracking since September 2026")
    ).toBeInTheDocument()
    expect(screen.getByText("UTC")).toBeInTheDocument()
    expect(screen.getByText("1.2K Visitors")).toBeInTheDocument()
  })

  it("opens the dashboard and visits the site in a new tab", () => {
    render(<SiteProfileCard site={SITE} stats={null} />)

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      `/site/${SITE.id}`
    )
    const visit = screen.getByRole("link", { name: "Visit myapp.com" })
    expect(visit).toHaveAttribute("href", "https://myapp.com")
    expect(visit).toHaveAttribute("target", "_blank")
    expect(visit).toHaveAttribute("rel", "noreferrer noopener")
  })

  it("uses the domain as the name when the site has no other name", () => {
    render(
      <SiteProfileCard site={{ ...SITE, name: "myapp.com" }} stats={null} />
    )

    expect(
      screen.getByRole("heading", { name: "myapp.com" })
    ).toBeInTheDocument()
  })
})
