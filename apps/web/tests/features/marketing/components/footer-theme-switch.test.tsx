import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { FooterThemeSwitch } from "@/features/marketing/components/footer-theme-switch"

const { setTheme } = vi.hoisted(() => ({ setTheme: vi.fn() }))
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme }),
}))

describe("FooterThemeSwitch", () => {
  it("marks the current choice as pressed", () => {
    render(<FooterThemeSwitch />)

    expect(
      screen.getByRole("button", { name: "Match my system" })
    ).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Dark theme" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("sets the theme that was clicked", async () => {
    render(<FooterThemeSwitch />)

    await userEvent.click(screen.getByRole("button", { name: "Dark theme" }))

    expect(setTheme).toHaveBeenCalledWith("dark")
  })
})
