import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { UsersTable } from "@/features/analytics/components/insights/users-table"
import { visitorName } from "@/features/analytics/utils/visitor-name"

import { visitor } from "@/tests/fixtures/analytics"

const NOW = new Date("2026-10-06T12:00:00.000Z")

function renderTable(...visitors: ReturnType<typeof visitor>[]) {
  return render(<UsersTable visitors={visitors} now={NOW} />)
}

function rowOf(name: string) {
  const row = screen.getByText(name).closest("tr")
  if (!row) throw new Error(`No row for ${name}`)
  return within(row)
}

describe("UsersTable", () => {
  it("shows the nickname, country, device, OS and browser", () => {
    renderTable(visitor())

    const row = rowOf(visitorName("visitor-1"))
    expect(row.getByText("India")).toBeInTheDocument()
    expect(row.getByText("Mobile")).toBeInTheDocument()
    expect(row.getByText("Android")).toBeInTheDocument()
    expect(row.getByText("Chrome")).toBeInTheDocument()
  })

  it("names the source and when they were last seen, with a week of activity", () => {
    renderTable(visitor())

    const row = rowOf(visitorName("visitor-1"))
    expect(row.getByText("Hacker News")).toBeInTheDocument()
    expect(row.getByText("5 minutes ago")).toHaveAttribute(
      "datetime",
      "2026-10-06T11:55:00.000Z"
    )
    expect(row.getByText("Visited on 2 of the last 7 days")).toBeInTheDocument()
  })

  it("narrows the rows as you search", async () => {
    renderTable(
      visitor(),
      visitor({ id: "visitor-2", country: "FR", source: "google" })
    )

    await userEvent.type(screen.getByLabelText("Search visitors"), "france")

    expect(
      screen.getByText(visitorName("visitor-1")).closest("tr")
    ).not.toBeVisible()
    expect(
      screen.getByText(visitorName("visitor-2")).closest("tr")
    ).toBeVisible()
  })

  it("renders tracker text as text, never as markup", () => {
    const { container } = renderTable(
      visitor({ source: "<i>x</i>", browser: "<b>b</b>" })
    )

    expect(screen.getByText("<i>x</i>")).toBeInTheDocument()
    expect(screen.getByText("<b>b</b>")).toBeInTheDocument()
    expect(container.querySelector("script, b, i")).not.toBeInTheDocument()
  })

  it("keeps the visitor id out of the page", () => {
    const { container } = renderTable(visitor({ id: "secret-id-42" }))

    expect(container.innerHTML).not.toContain("secret-id-42")
  })
})
