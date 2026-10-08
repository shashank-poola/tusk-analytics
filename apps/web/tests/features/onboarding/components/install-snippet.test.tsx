import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { InstallSnippet } from "@/features/onboarding/components/install-snippet"

const SNIPPETS = { html: "<script html />", nextjs: "<Script nextjs />" }

function mockClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn(writeText) },
    configurable: true,
  })
  return navigator.clipboard.writeText
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard")
})

describe("InstallSnippet", () => {
  it("shows the HTML snippet first and switches to Next.js", () => {
    render(<InstallSnippet snippets={SNIPPETS} continueHref="/site/vt_x" />)
    expect(screen.getByRole("tabpanel")).toHaveTextContent("<script html />")

    fireEvent.click(screen.getByRole("tab", { name: "Next.js" }))

    expect(screen.getByRole("tab", { name: "Next.js" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByRole("tabpanel")).toHaveTextContent("<Script nextjs />")
    expect(screen.getByText(/app\/layout\.tsx/)).toBeInTheDocument()
  })

  it("copies the visible snippet and says so", async () => {
    const writeText = mockClipboard(() => Promise.resolve())
    render(<InstallSnippet snippets={SNIPPETS} continueHref="/site/vt_x" />)

    fireEvent.click(screen.getByRole("button", { name: "Copy snippet" }))

    expect(
      await screen.findByRole("button", { name: "Copied" })
    ).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith("<script html />")
  })

  it("tells the user to copy by hand when the clipboard is blocked", async () => {
    mockClipboard(() => Promise.reject(new Error("NotAllowedError")))
    render(<InstallSnippet snippets={SNIPPETS} continueHref="/site/vt_x" />)

    fireEvent.click(screen.getByRole("button", { name: "Copy snippet" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't copy")
  })

  it("links Continue to the site page", () => {
    render(<InstallSnippet snippets={SNIPPETS} continueHref="/site/vt_x" />)

    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute(
      "href",
      "/site/vt_x"
    )
  })
})
