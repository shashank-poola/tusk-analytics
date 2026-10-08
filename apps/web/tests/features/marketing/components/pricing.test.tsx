import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Pricing } from "@/features/marketing/components/pricing"

const plan = (name: string) => within(screen.getByRole("article", { name }))

describe("Pricing", () => {
  it("reprices both plans when the events slider moves", () => {
    render(<Pricing />)

    expect(plan("Starter").getByText("$5")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Monthly events/), {
      target: { value: "1" },
    })

    expect(plan("Starter").getByText("$12")).toBeInTheDocument()
    expect(plan("Growth").getByText("$16")).toBeInTheDocument()
    expect(
      plan("Starter").getByText("Up to 100k monthly events")
    ).toBeInTheDocument()
  })

  it("shows the yearly price per month and per year", async () => {
    render(<Pricing />)

    await userEvent.click(screen.getByRole("button", { name: "Yearly" }))

    expect(screen.getByRole("button", { name: "Yearly" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(plan("Starter").getByText("$4.17")).toBeInTheDocument()
    expect(
      plan("Starter").getByText("$50 billed once a year")
    ).toBeInTheDocument()
  })

  it("asks to talk past 10M events instead of showing a price", () => {
    render(<Pricing />)

    fireEvent.change(screen.getByLabelText(/Monthly events/), {
      target: { value: "8" },
    })

    expect(plan("Starter").getByText("Custom")).toBeInTheDocument()
    expect(
      plan("Starter").getByRole("link", { name: "Talk to us on X" })
    ).toBeInTheDocument()
  })
})
