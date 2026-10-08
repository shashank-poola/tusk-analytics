import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AddSiteForm } from "@/features/onboarding/components/add-site-form"

const { addSite } = vi.hoisted(() => ({ addSite: vi.fn() }))

vi.mock("@/features/onboarding/server/add-site-action", () => ({ addSite }))

const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

function renderForm(onAdded = vi.fn()) {
  render(<AddSiteForm onAdded={onAdded} />)
  return onAdded
}

describe("AddSiteForm", () => {
  it("prefills the time zone from the browser", () => {
    renderForm()

    expect(screen.getByLabelText("Time zone")).toHaveValue(browserTimezone)
  })

  it("shows an inline error and doesn't submit an invalid domain", async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText("Domain"), "192.168.0.1")
    await userEvent.click(screen.getByRole("button", { name: "Add site" }))

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use your site's domain, not an IP address"
    )
    expect(screen.getByLabelText("Domain")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(addSite).not.toHaveBeenCalled()
  })

  it("submits the domain and time zone, then hands over the new site", async () => {
    const site = { id: "vt_3k9x2m7qpd4n8r1t", domain: "example.com" }
    addSite.mockResolvedValue({ ok: true, site })
    const onAdded = renderForm()

    await userEvent.type(
      screen.getByLabelText("Domain"),
      "https://www.example.com/"
    )
    await userEvent.selectOptions(
      screen.getByLabelText("Time zone"),
      "Europe/Berlin"
    )
    await userEvent.click(screen.getByRole("button", { name: "Add site" }))

    expect(addSite).toHaveBeenCalledWith({
      domain: "https://www.example.com/",
      timezone: "Europe/Berlin",
    })
    await waitFor(() => expect(onAdded).toHaveBeenCalledWith(site))
  })

  it("shows the error the server returns next to the domain", async () => {
    addSite.mockResolvedValue({
      ok: false,
      errors: {
        domain:
          "You already added example.com. Pick it from your dashboard instead.",
      },
    })
    const onAdded = renderForm()

    await userEvent.type(screen.getByLabelText("Domain"), "example.com")
    await userEvent.click(screen.getByRole("button", { name: "Add site" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You already added example.com"
    )
    expect(onAdded).not.toHaveBeenCalled()
  })
})
