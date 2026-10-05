import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AddSiteForm } from "@/features/onboarding/add-site-form"

const { addSite } = vi.hoisted(() => ({ addSite: vi.fn() }))

vi.mock("@/features/onboarding/add-site-action", () => ({ addSite }))

const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

describe("AddSiteForm", () => {
  it("prefills the time zone from the browser", () => {
    render(<AddSiteForm />)

    expect(screen.getByLabelText("Time zone")).toHaveValue(browserTimezone)
  })

  it("shows an inline error and doesn't submit an invalid domain", async () => {
    render(<AddSiteForm />)

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

  it("submits the domain and the chosen time zone", async () => {
    addSite.mockResolvedValue({})
    render(<AddSiteForm />)

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
  })

  it("shows the error the server returns next to the domain", async () => {
    addSite.mockResolvedValue({
      domain:
        "You already added example.com. Pick it from your dashboard instead.",
    })
    render(<AddSiteForm />)

    await userEvent.type(screen.getByLabelText("Domain"), "example.com")
    await userEvent.click(screen.getByRole("button", { name: "Add site" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You already added example.com"
    )
  })
})
