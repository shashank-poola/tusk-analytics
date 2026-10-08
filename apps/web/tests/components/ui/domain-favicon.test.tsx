import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DomainFavicon } from "@/components/ui/domain-favicon"

describe("DomainFavicon", () => {
  it("shows a globe until the text is a domain", () => {
    const { container } = render(<DomainFavicon value="myapp" />)

    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector("svg")).not.toBeNull()
  })

  it("uses our own icon for well-known sites, even from a full URL", () => {
    const { container } = render(
      <DomainFavicon value="https://www.github.com/acme" />
    )

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/icons/referrers/github.svg"
    )
  })

  it("asks the favicon service for other domains, by hostname only", () => {
    const { container } = render(<DomainFavicon value="myapp.com/pricing" />)

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://www.google.com/s2/favicons?domain=myapp.com&sz=32"
    )
  })
})
