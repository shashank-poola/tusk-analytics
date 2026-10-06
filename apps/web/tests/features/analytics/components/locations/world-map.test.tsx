import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { WorldMap } from "@/features/analytics/components/locations/world-map"

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

function renderMap() {
  return render(
    <WorldMap
      rows={[
        { key: "IN", visitors: 26, pageviews: 40 },
        { key: "US", visitors: 3, pageviews: 3 },
      ]}
      hrefFor={(row) => `/sites/x?country=${row.key}`}
    />
  )
}

describe("WorldMap", () => {
  it("shows a country's name and visitors while the pointer is over it", () => {
    const { container } = renderMap()
    const india = container.querySelector('[data-country="India"]')
    if (!india) throw new Error("No India")

    fireEvent.pointerMove(india)

    expect(screen.getByText("India")).toBeInTheDocument()
    expect(screen.getByText("26")).toBeInTheDocument()

    fireEvent.pointerLeave(india.closest("svg")?.parentElement ?? india)
    expect(screen.queryByText("26")).not.toBeInTheDocument()
  })

  it("shows 0 visitors over a country nobody came from", () => {
    const { container } = renderMap()
    const france = container.querySelector('[data-country="France"]')
    if (!france) throw new Error("No France")

    fireEvent.pointerMove(france)

    expect(screen.getByText("France")).toBeInTheDocument()
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("filters by a visited country on click, without a page load", async () => {
    renderMap()

    await userEvent.click(
      screen.getByRole("link", { name: "India: 26 visitors" })
    )

    expect(push).toHaveBeenCalledWith("/sites/x?country=IN", { scroll: false })
  })
})
