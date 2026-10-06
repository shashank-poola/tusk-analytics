import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { FunnelChart } from "@/features/analytics/components/insights/funnel-chart"
import { GoalsView } from "@/features/analytics/components/insights/goals-view"
import { InsightsCard } from "@/features/analytics/components/insights/insights-card"
import { NewFunnelDialog } from "@/features/analytics/components/insights/new-funnel-dialog"
import { parseView } from "@/features/analytics/utils/analytics-params"

import { SITE } from "@/tests/fixtures/analytics"

const { createFunnelAction, setViewAction } = vi.hoisted(() => ({
  createFunnelAction: vi.fn(),
  setViewAction: vi.fn(),
}))

vi.mock("@/features/analytics/server/funnel-actions", () => ({
  createFunnelAction,
}))
vi.mock("@/features/analytics/server/view-actions", () => ({ setViewAction }))

describe("InsightsCard", () => {
  it("has Goal, Funnel and User tabs in the URL, User open by default", () => {
    render(
      <InsightsCard siteId={SITE.id} view={parseView({ range: "30d" })}>
        <p>Body</p>
      </InsightsCard>
    )

    const nav = screen.getByRole("navigation", { name: "Insights" })
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent)
    ).toEqual(["Goal", "Funnel", "User"])
    expect(within(nav).getByRole("link", { name: "User" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(within(nav).getByRole("link", { name: "Goal" })).toHaveAttribute(
      "href",
      `/site/${SITE.id}?view=1&range=30d&insights=goal`
    )
  })
})

describe("FunnelChart", () => {
  it("shows visitors per step, the drop between steps and the conversion rate", () => {
    render(
      <FunnelChart
        periodLabel="Last 30 days"
        steps={[
          { type: "page", value: "/", visitors: 1000 },
          { type: "page", value: "/pricing", visitors: 400 },
          { type: "goal", value: "signup", visitors: 63 },
        ]}
      />
    )

    expect(screen.getByText("6.3% conversion rate")).toBeInTheDocument()
    expect(screen.getByText("-60%")).toBeInTheDocument()
    expect(screen.getByText("-84.3%")).toBeInTheDocument()
    expect(screen.getByText("Visit /pricing")).toBeInTheDocument()
    expect(screen.getByText("signup")).toBeInTheDocument()
  })
})

describe("GoalsView", () => {
  const goals = {
    interval: "day" as const,
    buckets: ["2026-10-05T00:00:00.000+00:00", "2026-10-06T00:00:00.000+00:00"],
    goals: [
      { name: "signup", visitors: 20, completions: 25, series: [8, 12] },
      { name: "checkout", visitors: 5, completions: 5, series: [] },
    ],
  }

  it("lists every goal with its visitors and filters them by search", async () => {
    render(<GoalsView goals={goals} />)

    const list = within(screen.getByRole("list", { name: "Goals" }))
    expect(list.getByText("20 visitors, 25 completions")).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText("Search goals"), "check")

    expect(list.getByText("signup").closest("li")).not.toBeVisible()
    expect(list.getByText("checkout").closest("li")).toBeVisible()
  })
})

describe("NewFunnelDialog", () => {
  it("saves the name and steps, then opens the new funnel", async () => {
    createFunnelAction.mockResolvedValue({
      ok: true,
      funnelId: "fn_aaaaaaaaaaaaaaaa",
    })
    render(
      <NewFunnelDialog
        siteId={SITE.id}
        pages={["/", "/pricing"]}
        goals={["signup"]}
        view={{}}
        triggerClassName=""
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "New funnel" }))
    await userEvent.type(
      screen.getByLabelText("Name", { selector: "input" }),
      "Signup"
    )
    await userEvent.type(screen.getByLabelText("Step 2 path"), "/pricing")
    await userEvent.click(screen.getByRole("button", { name: "Add a step" }))
    await userEvent.selectOptions(screen.getByLabelText("Step 3 kind"), "goal")
    await userEvent.type(screen.getByLabelText("Step 3 goal name"), "signup")
    await userEvent.click(screen.getByRole("button", { name: "Save funnel" }))

    expect(createFunnelAction).toHaveBeenCalledWith(SITE.id, {
      name: "Signup",
      steps: [
        { type: "page", value: "/" },
        { type: "page", value: "/pricing" },
        { type: "goal", value: "signup" },
      ],
    })
    await waitFor(() =>
      expect(setViewAction).toHaveBeenCalledWith(SITE.id, {
        insights: "funnel",
        funnel: "fn_aaaaaaaaaaaaaaaa",
      })
    )
  })

  it("shows the API's error and keeps the dialog open", async () => {
    createFunnelAction.mockResolvedValue({
      ok: false,
      error: "A site can have 20 funnels. Delete one to add another.",
    })
    render(
      <NewFunnelDialog
        siteId={SITE.id}
        pages={[]}
        goals={[]}
        view={{}}
        triggerClassName=""
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "New funnel" }))
    await userEvent.type(
      screen.getByLabelText("Name", { selector: "input" }),
      "x"
    )
    await userEvent.type(screen.getByLabelText("Step 2 path"), "/a")
    await userEvent.click(screen.getByRole("button", { name: "Save funnel" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("20 funnels")
  })
})
