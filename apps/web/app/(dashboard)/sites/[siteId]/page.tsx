import type { Metadata } from "next"
import { SITE_LIST_MAX_LIMIT } from "@workspace/contracts"
import { notFound } from "next/navigation"

import {
  BREAKDOWN_CARD_KEYS,
  BREAKDOWN_CARDS,
  parseBreakdownTabs,
  parseRange,
} from "@/features/analytics/utils/analytics-params"
import { SectionBoundary } from "@/features/analytics/components/section-boundary"
import {
  BreakdownSection,
  ChartSection,
  HighlightsSection,
  KpiSection,
  VisitorsSection,
} from "@/features/analytics/components/analytics-sections"
import { AnalyticsToolbar } from "@/features/analytics/components/analytics-toolbar"
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

  const range = parseRange(search.range)
  const tabs = parseBreakdownTabs(search)
  const section = { siteId: site.id, range }
  // Keys reset a section's boundaries, so a new range or tab shows its
  // skeleton (and replays the count-up) instead of stale numbers.
  return (
    <div className="space-y-4 sm:space-y-5">
      <AnalyticsToolbar site={site} sites={sites} range={range} tabs={tabs} />

      <OverviewCard
        totals={
          <SectionBoundary
            key={`kpis-${range}`}
            title="the totals"
            fallback={<KpiStripSkeleton />}
          >
            <KpiSection {...section} />
          </SectionBoundary>
        }
        chart={
          <SectionBoundary
            key={`chart-${range}`}
            title="the chart"
            fallback={<ChartSkeleton />}
          >
            <ChartSection {...section} />
          </SectionBoundary>
        }
      />

      <SectionBoundary
        key={`highlights-${range}`}
        title="the highlights"
        fallback={<HighlightsSkeleton />}
      >
        <HighlightsSection {...section} />
      </SectionBoundary>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {BREAKDOWN_CARD_KEYS.map((card) => {
          const by = tabs[card]
          const title =
            BREAKDOWN_CARDS[card].find((tab) => tab.by === by)?.label ?? card
          return (
            <BreakdownCard
              key={card}
              card={card}
              siteId={site.id}
              range={range}
              tabs={tabs}
            >
              <SectionBoundary
                key={`${by}-${range}`}
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
          key={`visitors-${range}`}
          title="recent visitors"
          fallback={<VisitorsSkeleton />}
        >
          <VisitorsSection {...section} />
        </SectionBoundary>
      </VisitorsCard>
    </div>
  )
}
