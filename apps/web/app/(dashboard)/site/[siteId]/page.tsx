import type { Metadata } from "next"
import { SITE_LIST_MAX_LIMIT } from "@workspace/contracts"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { VIEW_COOKIE } from "@/lib/view-cookie"

import {
  parseView,
  viewParams,
  scopeKey,
} from "@/features/analytics/utils/analytics-params"
import {
  BREAKDOWN_CARD_KEYS,
  cardTab,
} from "@/features/analytics/utils/breakdown-tabs"
import { periodLabel } from "@/features/analytics/utils/period-nav"
import { SectionBoundary } from "@/features/analytics/components/section-boundary"
import {
  BreakdownSection,
  ChartSection,
  KpiSection,
} from "@/features/analytics/components/analytics-sections"
import { AnalyticsToolbar } from "@/features/analytics/components/analytics-toolbar"
import { ChartEmptyState } from "@/features/analytics/components/empty-state"
import { BreakdownCard } from "@/features/analytics/components/breakdowns/breakdown-card"
import { OverviewCard } from "@/features/analytics/components/overview/overview-card"
import {
  BreakdownSkeleton,
  ChartSkeleton,
  InsightsSkeleton,
  KpiStripSkeleton,
} from "@/features/analytics/components/skeletons"
import { InsightsCard } from "@/features/analytics/components/insights/insights-card"
import { InsightsSection } from "@/features/analytics/components/insights/insights-section"
import { WaitingForFirstVisit } from "@/features/onboarding/components/waiting-for-first-visit"
import {
  getInstallStatus,
  getSite,
  listSites,
} from "@/features/sites/server/sites.queries"

// getSite is cached per request, so the page reuses this lookup.
export async function generateMetadata({
  params,
}: PageProps<"/site/[siteId]">): Promise<Metadata> {
  const site = await getSite((await params).siteId)
  if (!site) notFound()
  return { title: site.domain }
}

export default async function SitePage({
  params,
  searchParams,
}: PageProps<"/site/[siteId]">) {
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

  // The proxy keeps the view in a cookie and strips it from the URL. A query
  // that reached us anyway (too long for a cookie) wins over the cookie.
  const stored = (await cookies()).get(VIEW_COOKIE)?.value
  const view = parseView(viewParams(search, stored))
  const now = new Date()
  const section = { siteId: site.id, scope: view }
  // Keys reset a section's boundaries, so a new period, filter or tab shows
  // its skeleton (and replays the count-up) instead of stale numbers.
  const key = scopeKey(view)
  return (
    <div className="space-y-4 sm:space-y-5">
      <AnalyticsToolbar site={site} sites={sites} view={view} now={now} />

      <OverviewCard
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
              compare={view.compare}
              label={periodLabel(view.period, site.timezone, now)}
              emptyState={<ChartEmptyState siteId={site.id} view={view} />}
            />
          </SectionBoundary>
        }
      />

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {BREAKDOWN_CARD_KEYS.map((card) => {
          const tab = cardTab(card, view.tabs[card])
          return (
            <BreakdownCard key={card} card={card} siteId={site.id} view={view}>
              <SectionBoundary
                key={`${tab.id}-${key}`}
                title={tab.label.toLowerCase()}
                fallback={<BreakdownSkeleton />}
              >
                <BreakdownSection siteId={site.id} view={view} card={card} />
              </SectionBoundary>
            </BreakdownCard>
          )
        })}
      </div>

      <InsightsCard siteId={site.id} view={view}>
        <SectionBoundary
          key={`${view.insights}-${view.funnel ?? ""}-${view.interval}-${key}`}
          title={`the ${view.insights} tab`}
          fallback={<InsightsSkeleton />}
        >
          <InsightsSection
            siteId={site.id}
            view={view}
            periodLabel={periodLabel(view.period, site.timezone, now)}
            now={now}
          />
        </SectionBoundary>
      </InsightsCard>
    </div>
  )
}
