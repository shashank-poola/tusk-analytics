import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SiteCard } from "@/features/sites/components/site-card"

import { SITE } from "@/tests/fixtures/analytics"

describe("SiteCard", () => {
  it("names the site and opens its dashboard", () => {
    render(
      <SiteCard site={SITE}>
        <p>3 visitors</p>
      </SiteCard>
    )

    expect(screen.getByRole("link", { name: "myapp.com" })).toHaveAttribute(
      "href",
      `/site/${SITE.id}`
    )
    expect(screen.getByText("3 visitors")).toBeInTheDocument()
  })
})
