import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow"

const { addSite } = vi.hoisted(() => ({ addSite: vi.fn() }))

vi.mock("@/features/onboarding/server/add-site-action", () => ({ addSite }))

const SITE = { id: "vt_3k9x2m7qpd4n8r1t", domain: "example.com" }
const SCRIPT_URL = "https://t.test/script.js"

afterEach(() => {
  window.history.replaceState(null, "", "/")
})

const step = (name: string) =>
  within(screen.getByRole("list", { name: "Setup progress" }))
    .getByText(name)
    .closest("li")
    ?.getAttribute("aria-current")

describe("OnboardingFlow", () => {
  it("starts at adding the site, with two named steps", () => {
    render(<OnboardingFlow scriptUrl={SCRIPT_URL} />)

    expect(
      screen.getByRole("heading", { name: "Add your site" })
    ).toBeInTheDocument()
    expect(step("Add your site")).toBe("step")
    expect(step("Install the script")).toBeNull()
  })

  it("turns into the install step in the same card once the site exists", async () => {
    addSite.mockResolvedValue({ ok: true, site: SITE })
    render(<OnboardingFlow scriptUrl={SCRIPT_URL} />)

    await userEvent.type(screen.getByLabelText("Domain"), "example.com")
    await userEvent.click(screen.getByRole("button", { name: "Add site" }))

    expect(
      await screen.findByRole("heading", {
        name: /Install Tusk on example\.com/,
      })
    ).toBeInTheDocument()
    expect(step("Install the script")).toBe("step")
    // A reload, or a later sign-in, resumes here.
    expect(window.location.pathname).toBe(`/onboarding/${SITE.id}`)
    expect(
      screen.getByText(/data-site="vt_3k9x2m7qpd4n8r1t"/)
    ).toBeInTheDocument()
  })

  it("resumes at the install step for a site that exists", () => {
    render(<OnboardingFlow scriptUrl={SCRIPT_URL} initialSite={SITE} />)

    expect(
      screen.getByRole("heading", { name: /Install Tusk on example\.com/ })
    ).toBeInTheDocument()
  })
})
