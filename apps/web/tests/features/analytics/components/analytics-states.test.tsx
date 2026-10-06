import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import SitePage from "@/app/(dashboard)/sites/[siteId]/page"
import {
  SectionBoundary,
  SectionError,
} from "@/features/analytics/components/section-boundary"
import {
  ChartSection,
  HighlightsSection,
} from "@/features/analytics/components/analytics-sections"
import {
  ChartEmptyState,
  NoData,
} from "@/features/analytics/components/empty-state"
import { parseView } from "@/features/analytics/utils/analytics-params"

import {
  breakdown,
  NO_TOTALS,
  overview,
  SITE,
} from "@/tests/fixtures/analytics"

const { getSite, getInstallStatus, getOverview, getTimeseries, getBreakdown } =
  vi.hoisted(() => ({
    getSite: vi.fn(),
    getInstallStatus: vi.fn(),
    getOverview: vi.fn(),
    getTimeseries: vi.fn(),
    getBreakdown: vi.fn(),
  }))

vi.mock("@/features/sites/server/sites.queries", () => ({
  getSite,
  getInstallStatus,
  listSites: async () => [SITE],
}))
vi.mock("@/features/analytics/server/analytics.queries", () => ({
  getOverview,
  getTimeseries,
  getBreakdown,
}))
vi.mock("@/features/onboarding/server/install-status-action", () => ({
  checkInstallStatus: vi.fn(),
}))

describe("chart empty state", () => {
  it("points to the last 90 days first", () => {
    render(
      <ChartEmptyState siteId={SITE.id} view={parseView({ range: "7d" })} />
    )

    expect(screen.getByText("No visits in this period")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "See the last 90 days" })
    ).toHaveAttribute("href", `/sites/${SITE.id}?range=90d`)
  })

  it("points to the install snippet when even 90 days are empty", () => {
    render(
      <ChartEmptyState siteId={SITE.id} view={parseView({ range: "90d" })} />
    )

    expect(
      screen.getByRole("link", { name: "Check the install snippet" })
    ).toHaveAttribute("href", `/onboarding/${SITE.id}`)
  })

  it("is laid over the chart when the period has no visits", async () => {
    getTimeseries.mockResolvedValue({
      interval: "hour",
      points: [],
      inProgress: true,
    })
    getOverview.mockResolvedValue(overview(NO_TOTALS, NO_TOTALS))

    render(
      await ChartSection({
        siteId: SITE.id,
        scope: { period: { range: "24h", offset: 0 }, filters: {} },
        interval: "hour",
        label: "Last 24 hours",
        emptyState: <p>Nothing here</p>,
      })
    )

    expect(screen.getByText("Nothing here")).toBeInTheDocument()
  })
})

describe("NoData", () => {
  it("shows a quiet pill with a default or custom label", () => {
    render(
      <>
        <NoData />
        <NoData label="No visitors yet" />
      </>
    )

    expect(screen.getByText("No data")).toBeInTheDocument()
    expect(screen.getByText("No visitors yet")).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})

describe("error state", () => {
  it("says which section failed and offers a retry", async () => {
    const onRetry = vi.fn()
    render(<SectionError title="the chart" onRetry={onRetry} />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load the chart. The rest of the page is fine."
    )
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("replaces only the failing section", () => {
    using _ = vi.spyOn(console, "error").mockImplementation(() => {})
    function Failing(): never {
      throw new Error("API down")
    }

    render(
      <>
        <SectionBoundary title="the chart" fallback={null}>
          <Failing />
        </SectionBoundary>
        <p>Other section</p>
      </>
    )

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load the chart."
    )
    expect(screen.getByText("Other section")).toBeInTheDocument()
  })
})

describe("site page states", () => {
  it("answers 404 for a site the user can't see", async () => {
    getSite.mockResolvedValue(null)

    await expect(
      SitePage({
        params: Promise.resolve({ siteId: "vt_000000000000000a" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404")
    expect(getInstallStatus).not.toHaveBeenCalled()
  })

  it("shows the verify panel while the site has no events at all", async () => {
    getSite.mockResolvedValue(SITE)
    getInstallStatus.mockResolvedValue({ connected: false, firstEventAt: null })

    render(
      await SitePage({
        params: Promise.resolve({ siteId: SITE.id }),
        searchParams: Promise.resolve({ range: "30d" }),
      })
    )

    expect(
      screen.getByRole("heading", {
        name: /myapp\.com hasn't sent a visit yet/,
      })
    ).toBeInTheDocument()
    expect(screen.getByText("Waiting for the first visit")).toBeInTheDocument()
    expect(getOverview).not.toHaveBeenCalled()
  })

  it("hides the highlights when nothing is true enough to say", async () => {
    getOverview.mockResolvedValue(overview(NO_TOTALS, NO_TOTALS))
    getBreakdown.mockResolvedValue(breakdown("source", 0))

    const { container } = render(
      await HighlightsSection({
        siteId: SITE.id,
        scope: { period: { range: "7d", offset: 0 }, filters: {} },
      })
    )

    expect(container).toBeEmptyDOMElement()
  })
})
