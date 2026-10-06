import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AccountMenu } from "@/components/dashboard/account-menu"

const { signOut, replace } = vi.hoisted(() => ({
  signOut: vi.fn(),
  replace: vi.fn(),
}))

vi.mock("@/lib/auth-client", () => ({ authClient: { signOut } }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }))

function renderMenu() {
  render(
    <div>
      <button type="button">Outside</button>
      <AccountMenu name="Ada Lovelace" email="ada@example.com" />
    </div>
  )
  return screen.getByText("A", { selector: "summary span" }).closest("summary")!
}

describe("AccountMenu", () => {
  it("opens on click and shows the name, email and sign out", async () => {
    const trigger = renderMenu()
    const details = trigger.closest("details")!

    await userEvent.click(trigger)

    expect(details).toHaveAttribute("open")
    expect(screen.getByText("Ada Lovelace")).toBeVisible()
    expect(screen.getByText("ada@example.com")).toBeVisible()
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible()
  })

  it("names the trigger after the person", () => {
    renderMenu()

    expect(screen.getByLabelText("Account: Ada Lovelace")).toBeInTheDocument()
  })

  it("closes on Escape and returns focus to the trigger", async () => {
    const trigger = renderMenu()
    await userEvent.click(trigger)

    await userEvent.keyboard("{Escape}")

    expect(trigger.closest("details")).not.toHaveAttribute("open")
    expect(trigger).toHaveFocus()
  })

  it("closes on a click outside", async () => {
    const trigger = renderMenu()
    await userEvent.click(trigger)

    await userEvent.click(screen.getByRole("button", { name: "Outside" }))

    expect(trigger.closest("details")).not.toHaveAttribute("open")
  })

  it("stays open on a click inside", async () => {
    const trigger = renderMenu()
    await userEvent.click(trigger)

    await userEvent.click(screen.getByText("ada@example.com"))

    expect(trigger.closest("details")).toHaveAttribute("open")
  })

  it("signs out and goes to the sign-in page", async () => {
    signOut.mockResolvedValue(undefined)
    await userEvent.click(renderMenu())

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }))

    expect(signOut).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith("/signup")
  })

  it("falls back to the email when there is no name", () => {
    render(<AccountMenu name={null} email="ada@example.com" />)

    expect(
      screen.getByLabelText("Account: ada@example.com")
    ).toBeInTheDocument()
    expect(
      screen.getByText("a", { selector: "summary span" })
    ).toBeInTheDocument()
  })
})
