import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  PendingSectionScroll,
  SectionLink,
} from "@/features/marketing/components/section-link"

const { push, pathname } = vi.hoisted(() => ({
  push: vi.fn(),
  pathname: { current: "/" },
}))
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({ push }),
}))

const scrollIntoView = vi.fn()

function renderLink() {
  render(
    <>
      <SectionLink section="pricing">Pricing</SectionLink>
      <section id="pricing" />
    </>
  )
  const target = document.getElementById("pricing")
  if (target) target.scrollIntoView = scrollIntoView
}

afterEach(() => {
  push.mockReset()
  scrollIntoView.mockReset()
  sessionStorage.clear()
})

describe("SectionLink", () => {
  it("scrolls to the section on the landing page without touching the URL", async () => {
    pathname.current = "/"
    renderLink()

    await userEvent.click(screen.getByRole("link", { name: "Pricing" }))

    expect(scrollIntoView).toHaveBeenCalledOnce()
    expect(push).not.toHaveBeenCalled()
    expect(window.location.hash).toBe("")
  })

  it("goes to the landing page first from anywhere else", async () => {
    pathname.current = "/nope"
    renderLink()

    await userEvent.click(screen.getByRole("link", { name: "Pricing" }))

    expect(push).toHaveBeenCalledWith("/")
    expect(sessionStorage.getItem("tusk:pending-section")).toBe("pricing")
  })

  it("keeps the hash in the href for new tabs and no-JS clicks", () => {
    renderLink()

    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "/#pricing"
    )
  })
})

describe("PendingSectionScroll", () => {
  it("scrolls to the section picked on another page, once", () => {
    sessionStorage.setItem("tusk:pending-section", "pricing")
    const target = document.createElement("section")
    target.id = "pricing"
    target.scrollIntoView = scrollIntoView
    document.body.append(target)

    render(<PendingSectionScroll />)

    expect(scrollIntoView).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem("tusk:pending-section")).toBeNull()
    target.remove()
  })
})
