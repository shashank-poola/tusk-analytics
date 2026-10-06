import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppearancePicker } from "@/features/settings/components/appearance-picker"

const { theme, setTheme } = vi.hoisted(() => ({
  theme: { current: "light" as string | undefined },
  setTheme: vi.fn(),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: theme.current, setTheme }),
}))

describe("AppearancePicker", () => {
  it("selects the stored theme", () => {
    theme.current = "light"
    render(<AppearancePicker />)

    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Dark" })).not.toBeChecked()
  })

  it("selects System when nothing is stored", () => {
    theme.current = undefined
    render(<AppearancePicker />)

    expect(screen.getByRole("radio", { name: "System" })).toBeChecked()
  })

  it("sets the dark theme when Dark is selected", async () => {
    theme.current = "light"
    render(<AppearancePicker />)

    await userEvent.click(screen.getByRole("radio", { name: "Dark" }))

    expect(setTheme).toHaveBeenCalledWith("dark")
  })
})
