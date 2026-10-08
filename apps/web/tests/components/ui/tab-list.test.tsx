import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it } from "vitest"

import { TabList } from "@/components/ui/tab-list"

const TABS = [
  { id: "script", label: "Script" },
  { id: "npm", label: "npm" },
  { id: "lovable", label: "Lovable" },
]

function Harness() {
  const [active, setActive] = useState("script")
  return (
    <TabList
      label="How to install"
      tabs={TABS}
      active={active}
      onChange={setActive}
      idPrefix="test"
    />
  )
}

const tab = (name: string) => screen.getByRole("tab", { name })

describe("TabList", () => {
  it("is one tab stop: only the selected tab is focusable", () => {
    render(<Harness />)

    expect(tab("Script")).toHaveAttribute("tabindex", "0")
    expect(tab("npm")).toHaveAttribute("tabindex", "-1")
  })

  it("moves and selects with the arrow keys, wrapping around", async () => {
    render(<Harness />)
    tab("Script").focus()

    await userEvent.keyboard("{ArrowRight}")
    expect(tab("npm")).toHaveFocus()
    expect(tab("npm")).toHaveAttribute("aria-selected", "true")

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(tab("Lovable")).toHaveFocus()
  })

  it("jumps to the ends with Home and End", async () => {
    render(<Harness />)
    tab("Script").focus()

    await userEvent.keyboard("{End}")
    expect(tab("Lovable")).toHaveAttribute("aria-selected", "true")

    await userEvent.keyboard("{Home}")
    expect(tab("Script")).toHaveFocus()
  })
})
