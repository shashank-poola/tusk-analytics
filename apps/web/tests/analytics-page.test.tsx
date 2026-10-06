import { render, screen, within } from "@testing-library/react"
import type {
  StatsBreakdownResponse,
  StatsOverviewResponse,
  StatsTimeseriesResponse,
} from "@workspace/contracts"
import { describe, expect, it, vi } from "vitest"

import SiteLayout from "@/app/(dashboard)/sites/[siteId]/layout"
import SitePage from "@/app/(dashboard)/sites/[siteId]/page"
import { AnalyticsSection } from "@/features/analytics/analytics-section"
import {
  BreakdownSection,
  ChartSection,
} from "@/features/analytics/analytics-sections"
import { StatCards } from "@/features/analytics/stat-cards"

const {
  getSite,
  listSites,
  getInstallStatus,
  getOverview,
  getTimeseries,
  getBreakdown,
  notFound,
} = vi.hoisted(() => ({
  getSite: vi.fn(),
  listSites: vi.fn(),
  getInstallStatus: vi.fn(),
  getOverview: vi.fn(),
  getTimeseries: vi.fn(),
  getBreakdown: vi.fn(),
  // Like the real one, notFound() throws to stop rendering.
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

vi.mock("@/features/sites/sites.queries", () => ({
  getSite,
  listSites,
  getInstallStatus,
}))
vi.mock("next/navigation", () => ({
  notFound,
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/sites/vt_3k9x2m7qpd4n8r1t",
  useSearchParams: () => new URLSearchParams("range=30d"),
}))
vi.mock("@/features/analytics/analytics.queries", () => ({
  getOverview,
  getTimeseries,
  getBreakdown,
}))
vi.mock("@/features/onboarding/install-status-action", () => ({
  checkInstallStatus: vi.fn(),
}))

const SITE = {
  id: "vt_3k9x2m7qpd4n8r1t",
  name: "My app",
  domain: "myapp.com",
  timezone: "UTC",
  createdAt: "2026-09-01T00:00:00.000Z",
}

const RANGE = {
  from: "2026-09-30T00:00:00.000Z",
  to: "2026-10-06T12:00:00.000Z",
  previousFrom: "2026-09-23T12:00:00.000Z",
  previousTo: "2026-09-30T00:00:00.000Z",
}

function overview(
  current: StatsOverviewResponse["current"],
  previous: StatsOverviewResponse["previous"]
): StatsOverviewResponse {
  return { range: RANGE, current, previous }
}

const NO_TOTALS = { visitors: 0, pageviews: 0, sessions: 0, bounceRate: 0 }

/** The `<dd>` with the change for the card labelled `label`. */
function changeFor(label: string) {
  const card = screen.getByText(label).closest("div")
  if (!card) throw new Error(`No card for ${label}`)
  const [, change] = within(card).getAllByRole("definition")
  return change
}

describe("StatCards", () => {
  it("shows each change with an arrow, a sign and words", () => {
    render(
      <StatCards
        overview={overview(
          { visitors: 1200, pageviews: 3000, sessions: 1500, bounceRate: 0.44 },
          { visitors: 1000, pageviews: 4000, sessions: 1500, bounceRate: 0.4 }
        )}
      />
    )

    expect(screen.getByText("1.2K")).toBeInTheDocument()
    expect(changeFor("Visitors")).toHaveTextContent("↑ +20% vs previous period")
    expect(changeFor("Pageviews")).toHaveTextContent(
      "↓ -25% vs previous period"
    )
    expect(changeFor("Sessions")).toHaveTextContent("→ 0% vs previous period")
    expect(changeFor("Bounce rate")).toHaveTextContent(
      "↑ +4 pts vs previous period"
    )
    expect(screen.getByText("44%")).toBeInTheDocument()
  })

  it("shows – when the previous value is 0", () => {
    render(
      <StatCards
        overview={overview(
          { visitors: 5, pageviews: 9, sessions: 6, bounceRate: 0.5 },
          NO_TOTALS
        )}
      />
    )

    for (const label of ["Visitors", "Pageviews", "Sessions", "Bounce rate"]) {
      expect(changeFor(label)).toHaveTextContent(
        "–No data for the previous period"
      )
    }
  })
})

describe("site page states", () => {
  it("shows the verify panel while the site has no events at all", async () => {
    getSite.mockResolvedValue(SITE)
    getInstallStatus.mockResolvedValue({
      connected: false,
      firstEventAt: null,
    })

    render(
      await SitePage({
        params: Promise.resolve({ siteId: SITE.id }),
        searchParams: Promise.resolve({ range: "30d" }),
      })
    )

    expect(screen.getByText("Waiting for the first visit")).toBeInTheDocument()
    expect(getOverview).not.toHaveBeenCalled()
  })

  it("says there are no visits when the range is empty", async () => {
    const points: StatsTimeseriesResponse["points"] = [
      { t: "2026-10-05T00:00:00.000+00:00", visitors: 0, pageviews: 0 },
      { t: "2026-10-06T00:00:00.000+00:00", visitors: 0, pageviews: 0 },
    ]
    getTimeseries.mockResolvedValue({ interval: "day", points })
    getOverview.mockResolvedValue(overview(NO_TOTALS, NO_TOTALS))
    getBreakdown.mockResolvedValue({
      by: "source",
      rows: [],
    } satisfies StatsBreakdownResponse)

    render(
      <>
        {await ChartSection({ siteId: SITE.id, range: "24h" })}
        {await BreakdownSection({
          siteId: SITE.id,
          range: "24h",
          by: "source",
        })}
      </>
    )

    expect(screen.getAllByText(/No visits in this period/)).toHaveLength(2)
  })

  it("shows breakdown keys as text, with full country names", async () => {
    getBreakdown.mockResolvedValue({
      by: "country",
      rows: [
        { key: "IN", visitors: 30, pageviews: 50 },
        { key: null, visitors: 3, pageviews: 3 },
      ],
    } satisfies StatsBreakdownResponse)

    render(
      await BreakdownSection({ siteId: SITE.id, range: "7d", by: "country" })
    )

    expect(screen.getByRole("cell", { name: "India" })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "Unknown" })).toBeInTheDocument()
  })
})

describe("site layout", () => {
  function renderLayout(siteId: string) {
    return SiteLayout({
      params: Promise.resolve({ siteId }),
      children: <p>page</p>,
    })
  }

  it("answers 404 for a site the user can't see", async () => {
    getSite.mockResolvedValue(null)
    listSites.mockResolvedValue([])

    await expect(renderLayout("vt_000000000000000a")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    )
  })

  it("lists the user's sites and links to add one", async () => {
    getSite.mockResolvedValue(SITE)
    listSites.mockResolvedValue([
      SITE,
      { ...SITE, id: "vt_aaaaaaaaaaaaaaaa", name: "Blog", domain: "blog.dev" },
    ])
    getInstallStatus.mockResolvedValue({
      connected: true,
      firstEventAt: "2026-10-01T00:00:00.000Z",
    })

    render(await renderLayout(SITE.id))

    expect(screen.getByRole("heading", { name: "My app" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Blog/ })).toHaveAttribute(
      "href",
      "/sites/vt_aaaaaaaaaaaaaaaa"
    )
    expect(screen.getByRole("link", { name: "Add site" })).toHaveAttribute(
      "href",
      "/onboarding"
    )
    expect(screen.getByRole("combobox", { name: "Date range" })).toHaveValue(
      "30d"
    )
  })

  it("hides the range picker until the site has events", async () => {
    getSite.mockResolvedValue(SITE)
    listSites.mockResolvedValue([SITE])
    getInstallStatus.mockResolvedValue({ connected: false, firstEventAt: null })

    render(await renderLayout(SITE.id))

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })
})

describe("AnalyticsSection", () => {
  it("shows a retry button in place of a failing section only", () => {
    // React logs caught render errors; keep the test output clean.
    using _ = vi.spyOn(console, "error").mockImplementation(() => {})
    function Failing(): never {
      throw new Error("API down")
    }

    render(
      <>
        <AnalyticsSection title="the chart" fallback={null}>
          <Failing />
        </AnalyticsSection>
        <p>Other section</p>
      </>
    )

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load the chart."
    )
    expect(
      screen.getByRole("button", { name: "Try again" })
    ).toBeInTheDocument()
    expect(screen.getByText("Other section")).toBeInTheDocument()
  })
})
