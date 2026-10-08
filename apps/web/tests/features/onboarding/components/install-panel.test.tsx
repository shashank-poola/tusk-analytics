import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { InstallPanel } from "@/features/onboarding/components/install-panel"
import { buildSnippets } from "@/features/onboarding/utils/snippets"

const SITE = {
  siteId: "vt_3k9x2m7qpd4n8r1t",
  scriptUrl: "https://t.test/s.js",
}

function renderPanel() {
  render(
    <InstallPanel
      snippets={{
        standard: buildSnippets(SITE),
        cookieless: buildSnippets({ ...SITE, cookieless: true }),
      }}
      continueHref="/site/vt_3k9x2m7qpd4n8r1t"
    />
  )
}

describe("InstallPanel", () => {
  it("offers Next.js, npm, Lovable and Shopify, starting on Next.js", () => {
    renderPanel()

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Next.js",
      "npm",
      "Lovable",
      "Shopify",
    ])
    expect(screen.getByRole("tab", { name: "Next.js" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(
      screen.getByText(/import Script from "next\/script"/)
    ).toBeInTheDocument()
  })

  it("goes to the dashboard once the script is added", () => {
    renderPanel()

    expect(
      screen.getByRole("link", { name: "I've added the script" })
    ).toHaveAttribute("href", "/site/vt_3k9x2m7qpd4n8r1t")
  })

  it("switches every snippet to cookieless with the switch", async () => {
    renderPanel()
    const toggle = screen.getByRole("switch", { name: /Cookieless tracking/ })

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute("aria-checked", "true")
    expect(screen.getByText(/data-cookieless="true"/)).toBeInTheDocument()
  })

  it("shows the npm package on its tab", async () => {
    renderPanel()

    await userEvent.click(screen.getByRole("tab", { name: "npm" }))

    expect(screen.getByText("npm i @usetusk/analytics")).toBeInTheDocument()
  })

  it("tells Shopify stores where in the theme the script goes", async () => {
    renderPanel()

    await userEvent.click(screen.getByRole("tab", { name: "Shopify" }))

    expect(
      screen.getByText(/Online Store → Themes → Edit code/)
    ).toBeInTheDocument()
    expect(screen.getByText(/<script defer data-site=/)).toBeInTheDocument()
  })

  it("enables Open in Lovable only for a Lovable project link", async () => {
    renderPanel()
    await userEvent.click(screen.getByRole("tab", { name: "Lovable" }))
    expect(
      screen.queryByRole("link", { name: "Open in Lovable" })
    ).not.toBeInTheDocument()

    await userEvent.type(
      screen.getByLabelText("Lovable project link"),
      "https://lovable.dev/projects/0a1b2c3d-4e5f"
    )

    expect(
      screen.getByRole("link", { name: "Open in Lovable" })
    ).toHaveAttribute(
      "href",
      expect.stringMatching(
        /^https:\/\/lovable\.dev\/projects\/0a1b2c3d-4e5f\?prompt=Add%20Tusk/
      )
    )
  })
})
