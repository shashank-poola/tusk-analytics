import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Faq } from "@/features/marketing/components/faq"

const question = (name: string) => screen.getByRole("button", { name })

describe("Faq", () => {
  it("opens the first answer and keeps only one open at a time", async () => {
    render(<Faq />)
    const first = question("Can I try it for free?")
    const second = question("Does Tusk use cookies?")
    expect(first).toHaveAttribute("aria-expanded", "true")

    await userEvent.click(second)

    expect(second).toHaveAttribute("aria-expanded", "true")
    expect(first).toHaveAttribute("aria-expanded", "false")
  })

  it("closes an open answer when its question is clicked again", async () => {
    render(<Faq />)
    const first = question("Can I try it for free?")

    await userEvent.click(first)

    expect(first).toHaveAttribute("aria-expanded", "false")
  })

  it("keeps closed answers in the page but out of reach", () => {
    render(<Faq />)
    const panel = document.getElementById(
      question("How big is the script?").getAttribute("aria-controls") ?? ""
    )

    expect(panel).toHaveTextContent("About 1.5 KB gzipped")
    expect(panel).toHaveAttribute("inert")
  })

  it("moves between questions with the arrow keys, Home and End", async () => {
    render(<Faq />)
    question("Can I try it for free?").focus()

    await userEvent.keyboard("{ArrowDown}")
    expect(question("Does Tusk use cookies?")).toHaveFocus()

    await userEvent.keyboard("{End}")
    expect(question("Does it work with ad blockers?")).toHaveFocus()

    await userEvent.keyboard("{ArrowDown}")
    expect(question("Can I try it for free?")).toHaveFocus()
  })
})
