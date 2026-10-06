import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { visitorName } from "@/features/analytics/utils/visitor-name"
import { VisitorsList } from "@/features/analytics/components/visitors/visitors-card"

import { visitor } from "@/tests/fixtures/analytics"

const NOW = new Date("2026-10-06T12:00:00.000Z")

function renderList(...visitors: ReturnType<typeof visitor>[]) {
  return render(<VisitorsList visitors={visitors} now={NOW} />)
}

describe("VisitorsList", () => {
  it("shows the nickname and where the visitor is", () => {
    renderList(visitor())

    expect(screen.getByText(visitorName("visitor-1"))).toBeInTheDocument()
    expect(screen.getByText("Bengaluru, India")).toBeInTheDocument()
    expect(screen.getByText("Mobile")).toBeInTheDocument()
    expect(screen.getByText("Android")).toBeInTheDocument()
    expect(screen.getByText("Chrome")).toBeInTheDocument()
  })

  it("shows only the country when the city is unknown", () => {
    renderList(visitor({ city: null }))

    expect(screen.getByText("India")).toBeInTheDocument()
  })

  it("names the source, with pages, visits and when they were last seen", () => {
    renderList(visitor())

    const row = screen.getAllByRole("row")[1]
    if (!row) throw new Error("No visitor row")
    expect(within(row).getByText("Hacker News")).toBeInTheDocument()
    expect(within(row).getByText("4")).toBeInTheDocument()
    expect(within(row).getByText("2 visits")).toBeInTheDocument()
    expect(within(row).getByText("5 minutes ago")).toHaveAttribute(
      "datetime",
      "2026-10-06T11:55:00.000Z"
    )
    expect(within(row).getByText("on /pricing")).toBeInTheDocument()
  })

  it("says 1 visit in the singular", () => {
    renderList(visitor({ sessions: 1 }))

    expect(screen.getByText("1 visit")).toBeInTheDocument()
  })

  it("renders tracker text as text, never as markup", () => {
    const lastPage = "/<script>alert(1)</script>"
    const { container } = renderList(
      visitor({ lastPage, city: "<b>Gotham</b>", source: "<i>x</i>" })
    )

    expect(screen.getByText(`on ${lastPage}`)).toBeInTheDocument()
    expect(screen.getByText("<b>Gotham</b>, India")).toBeInTheDocument()
    expect(screen.getByText("<i>x</i>")).toBeInTheDocument()
    expect(container.querySelector("script, b, i")).not.toBeInTheDocument()
  })

  it("keeps the visitor id out of the page", () => {
    const { container } = renderList(visitor({ id: "secret-id-42" }))

    expect(container.innerHTML).not.toContain("secret-id-42")
  })
})
