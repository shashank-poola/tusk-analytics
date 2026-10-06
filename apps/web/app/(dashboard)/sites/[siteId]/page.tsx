import type { Metadata } from "next"
import { SITE_LIST_MAX_LIMIT } from "@workspace/contracts"
import { notFound } from "next/navigation"

import { routes } from "@/lib/routes"

import {
  BREAKDOWN_CARD_KEYS,
  BREAKDOWN_CARDS,
  parseView,
  periodKey,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import {
  nextPeriod,
  periodLabel,
  previousPeriod,
  siteToday,
} from "@/features/analytics/utils/period-nav"
import { SectionBoundary } from "@/features/analytics/components/section-boundary"
import {
  BreakdownSection,
  ChartSection,
  HighlightsSection,
  KpiSection,
  VisitorsSection,
} from "@/features/analytics/components/analytics-sections"
import { AnalyticsToolbar } from "@/features/analytics/components/analytics-toolbar"
import { ChartEmptyState } from "@/features/analytics/components/empty-state"
import { BreakdownCard } from "@/features/analytics/components/breakdowns/breakdown-card"
import { OverviewCard } from "@/features/analytics/components/overview/overview-card"
import {
  BreakdownSkeleton,
  ChartSkeleton,
  HighlightsSkeleton,
  KpiStripSkeleton,
  VisitorsSkeleton,
} from "@/features/analytics/components/skeletons"
import { VisitorsCard } from "@/features/analytics/components/visitors/visitors-card"
import { WaitingForFirstVisit } from "@/features/onboarding/components/waiting-for-first-visit"
import {
  getInstallStatus,
  getSite,
  listSites,
} from "@/features/sites/server/sites.queries"

export const metadata: Metadata = {
  title: "Site · Viewtally",
}

export default async function SitePage({
  params,
  searchParams,
}: PageProps<"/sites/[siteId]">) {
  const [{ siteId }, search] = await Promise.all([params, searchParams])
  const [site, sites] = await Promise.all([
    getSite(siteId),
    listSites({ limit: SITE_LIST_MAX_LIMIT }),
  ])
  if (!site) notFound()

  const installStatus = await getInstallStatus(site.id)
  if (!installStatus.connected) {
    return <WaitingForFirstVisit site={site} initialStatus={installStatus} />
  }

  const view = parseView(search)
  const now = new Date()
  const section = { siteId: site.id, period: view.period }
  // Keys reset a section's boundaries, so a new period or tab shows its
  // skeleton (and replays the count-up) instead of stale numbers.
  const key = periodKey(view.period)
  const next = nextPeriod(view.period, siteToday(site.timezone, now))
  return (
    <div className="space-y-4 sm:space-y-5">
      <AnalyticsToolbar site={site} sites={sites} view={view} now={now} />

      <OverviewCard
        previousHref={routes.site(
          site.id,
          viewSearch(view, { period: previousPeriod(view.period) })
        )}
        nextHref={
          next && routes.site(site.id, viewSearch(view, { period: next }))
        }
        totals={
          <SectionBoundary
            key={`kpis-${key}`}
            title="the totals"
            fallback={<KpiStripSkeleton />}
          >
            <KpiSection {...section} />
          </SectionBoundary>
        }
        chart={
          <SectionBoundary
            key={`chart-${key}-${view.interval}`}
            title="the chart"
            fallback={<ChartSkeleton />}
          >
            <ChartSection
              {...section}
              interval={view.interval}
              label={periodLabel(view.period, site.timezone, now)}
              emptyState={<ChartEmptyState siteId={site.id} view={view} />}
            />
          </SectionBoundary>
        }
      />

      <SectionBoundary
        key={`highlights-${key}`}
        title="the highlights"
        fallback={<HighlightsSkeleton />}
      >
        <HighlightsSection {...section} />
      </SectionBoundary>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {BREAKDOWN_CARD_KEYS.map((card) => {
          const by = view.tabs[card]
          const title =
            BREAKDOWN_CARDS[card].find((tab) => tab.by === by)?.label ?? card
          return (
            <BreakdownCard key={card} card={card} siteId={site.id} view={view}>
              <SectionBoundary
                key={`${by}-${key}`}
                title={title.toLowerCase()}
                fallback={<BreakdownSkeleton />}
              >
                <BreakdownSection {...section} by={by} title={title} />
              </SectionBoundary>
            </BreakdownCard>
          )
        })}
      </div>

      <VisitorsCard>
        <SectionBoundary
          key={`visitors-${key}`}
          title="recent visitors"
          fallback={<VisitorsSkeleton />}
        >
          <VisitorsSection {...section} />
        </SectionBoundary>
      </VisitorsCard>
    </div>
  )
}
