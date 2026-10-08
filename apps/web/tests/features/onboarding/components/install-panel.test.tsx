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
  it("shows the script tag first and goes to the dashboard once added", () => {
    renderPanel()

    expect(screen.getByText(/<script defer data-site=/)).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "I've added the script" })
    ).toHaveAttribute("href", "/site/vt_3k9x2m7qpd4n8r1t")
  })

  it("switches every snippet to cookieless with the switch", async () => {
    renderPanel()
    const toggle = screen.getByRole("switch", { name: /Cookieless mode/ })

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute("aria-checked", "true")
    expect(screen.getByText(/data-cookieless="true"/)).toBeInTheDocument()
  })

  it("shows the npm package on its tab", async () => {
    renderPanel()

    await userEvent.click(screen.getByRole("tab", { name: /npm/ }))

    expect(screen.getByText("npm i @usetusk/analytics")).toBeInTheDocument()
  })

  it("enables Open in Lovable only for a Lovable project link", async () => {
    renderPanel()
    await userEvent.click(screen.getByRole("tab", { name: /Lovable/ }))
    expect(
      screen.queryByRole("link", { name: /Open in Lovable/ })
    ).not.toBeInTheDocument()

    await userEvent.type(
      screen.getByLabelText("Your Lovable project link"),
      "https://lovable.dev/projects/0a1b2c3d-4e5f"
    )

    expect(
      screen.getByRole("link", { name: /Open in Lovable/ })
    ).toHaveAttribute(
      "href",
      expect.stringMatching(
        /^https:\/\/lovable\.dev\/projects\/0a1b2c3d-4e5f\?prompt=Add%20Tusk/
      )
    )
  })
})
