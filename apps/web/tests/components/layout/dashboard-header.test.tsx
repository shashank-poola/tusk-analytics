import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { SiteSwitcher } from "@/features/sites/components/site-switcher"

import { SITE } from "@/tests/fixtures/analytics"

const { theme, setTheme } = vi.hoisted(() => ({
  theme: { resolvedTheme: "light" },
  setTheme: vi.fn(),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: theme.resolvedTheme, setTheme }),
}))
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: vi.fn() } }))
vi.mock("next/navigation", () => ({
  useParams: () => ({ siteId: SITE.id }),
  useRouter: () => ({ replace: vi.fn() }),
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

  it("names the current site and lists the others, the snippet and Add site", async () => {
    render(<SiteSwitcher current={SITE} sites={[SITE, BLOG]} />)

    await userEvent.click(
      screen.getByLabelText("Switch site, current: myapp.com")
    )

    expect(screen.getByRole("link", { name: /^myapp\.com/ })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByRole("link", { name: "blog.dev" })).toHaveAttribute(
      "href",
      "/site/vt_aaaaaaaaaaaaaaaa"
    )
    expect(screen.getByRole("link", { name: "Tracking code" })).toHaveAttribute(
      "href",
      `/onboarding/${SITE.id}`
    )
    expect(screen.getByRole("link", { name: "Add site" })).toHaveAttribute(
      "href",
      "/onboarding"
    )
  })
})

describe("DashboardHeader", () => {
  const AVATAR = "data:image/svg+xml;base64,AA=="

  function renderHeader() {
    render(
      <DashboardHeader
        name="Ada Lovelace"
        email="ada@example.com"
        avatarSrc={AVATAR}
      />
    )
  }

  it("has only the logo, the theme toggle and the account menu", () => {
    renderHeader()

    expect(screen.getByRole("link", { name: "Tusk home" })).toHaveAttribute(
      "href",
      "/dashboard"
    )
    expect(screen.getByLabelText("Account: Ada Lovelace")).toBeInTheDocument()
    expect(screen.queryByLabelText(/Switch site/)).not.toBeInTheDocument()
  })

  it("has no bottom border", () => {
    renderHeader()

    expect(screen.getByRole("banner").className).not.toMatch(/border-b/)
  })
})
