import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DomainStart } from "@/features/marketing/components/domain-start"

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

afterEach(() => {
  document.cookie = "tusk_signup_domain=; Max-Age=0; Path=/"
  push.mockReset()
})

describe("DomainStart", () => {
  it("shows the site's icon as soon as the domain is valid", async () => {
    const { container } = render(<DomainStart />)
    const input = screen.getByLabelText("Your website")

    await userEvent.type(input, "github")
    expect(container.querySelector("img")).toBeNull()

    await userEvent.type(input, ".com")
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/icons/referrers/github.svg"
    )
  })

  it("keeps the domain for onboarding and goes to sign-in", async () => {
    render(<DomainStart />)

    await userEvent.type(
      screen.getByLabelText("Your website"),
      "https://www.MyApp.com/pricing"
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Start tracking free" })
    )

    expect(document.cookie).toContain("tusk_signup_domain=myapp.com")
    expect(push).toHaveBeenCalledWith("/signup")
  })

  it("says what's wrong instead of moving on", async () => {
    render(<DomainStart />)

    await userEvent.type(screen.getByLabelText("Your website"), "not a site")
    await userEvent.click(
      screen.getByRole("button", { name: "Start tracking free" })
    )

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a domain like myapp.com"
    )
    expect(push).not.toHaveBeenCalled()
  })
})
