import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { InstallChecklist } from "@/features/onboarding/components/install-checklist"

describe("InstallChecklist", () => {
  it("lists the four things to check and names the domain", () => {
    render(<InstallChecklist domain="myapp.com" />)

    expect(
      screen.getByRole("heading", { name: "No data yet? Check that:" })
    ).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(4)
    expect(screen.getByText(/snippet is inside the <head>/)).toBeInTheDocument()
    expect(
      screen.getByText(/opened myapp\.com or www\.myapp\.com exactly/)
    ).toBeInTheDocument()
    expect(screen.getByText(/ad blocker/)).toBeInTheDocument()
    expect(screen.getByText(/cached page/)).toBeInTheDocument()
  })
})
