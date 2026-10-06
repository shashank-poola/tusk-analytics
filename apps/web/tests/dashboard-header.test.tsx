import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ThemeToggle } from "@/components/dashboard/theme-toggle"
import { SiteSwitcher } from "@/features/sites/site-switcher"

import { SITE } from "./fixtures/analytics"

const { theme, setTheme } = vi.hoisted(() => ({
  theme: { resolvedTheme: "light" },
  setTheme: vi.fn(),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: theme.resolvedTheme, setTheme }),
}))
vi.mock("next/navigation", () => ({
  useParams: () => ({ siteId: SITE.id }),
}))

describe("ThemeToggle", () => {
  it("switches to dark from light", async () => {
    theme.resolvedTheme = "light"
    render(<ThemeToggle />)

    await userEvent.click(
      screen.getByRole("button", { name: "Switch to dark theme" })
    )

    expect(setTheme).toHaveBeenCalledWith("dark")
  })

  it("switches to light from dark", async () => {
    theme.resolvedTheme = "dark"
    render(<ThemeToggle />)

    await userEvent.click(
      screen.getByRole("button", { name: "Switch to light theme" })
    )

    expect(setTheme).toHaveBeenCalledWith("light")
  })
})

describe("SiteSwitcher", () => {
  const BLOG = {
    ...SITE,
    id: "vt_aaaaaaaaaaaaaaaa",
    name: "blog.dev",
    domain: "blog.dev",
  }

  it("names the current site and lists the others with Add site", async () => {
    render(<SiteSwitcher sites={[SITE, BLOG]} />)

    const toggle = screen.getByText("myapp.com", { selector: "summary span" })
    await userEvent.click(toggle)

    expect(screen.getByRole("link", { name: /^myapp\.com/ })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByRole("link", { name: "blog.dev" })).toHaveAttribute(
      "href",
      "/sites/vt_aaaaaaaaaaaaaaaa"
    )
    expect(screen.getByRole("link", { name: "Add site" })).toHaveAttribute(
      "href",
      "/onboarding"
    )
  })
})
