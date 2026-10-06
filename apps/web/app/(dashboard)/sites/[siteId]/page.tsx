import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { parseRange, parseTab } from "@/features/analytics/analytics-params"
import { AnalyticsSection } from "@/features/analytics/analytics-section"
import {
  BreakdownSection,
  ChartSection,
  OverviewSection,
} from "@/features/analytics/analytics-sections"
import { BreakdownTabs } from "@/features/analytics/breakdown-tabs"
import {
  BreakdownSkeleton,
  ChartSkeleton,
  StatCardsSkeleton,
} from "@/features/analytics/skeletons"
import { VerifyInstallation } from "@/features/onboarding/verify-installation"
import { getInstallStatus, getSite } from "@/features/sites/sites.queries"

export const metadata: Metadata = {
  title: "Site · Viewtally",
}

export default async function SitePage({
  params,
  searchParams,
}: PageProps<"/sites/[siteId]">) {
  const [{ siteId }, search] = await Promise.all([params, searchParams])
  const site = await getSite(siteId)
  if (!site) notFound()

  const installStatus = await getInstallStatus(site.id)
  if (!installStatus.connected) {
    return (
      <VerifyInstallation
        siteId={site.id}
        domain={site.domain}
        initialStatus={installStatus}
      />
    )
  }

  const range = parseRange(search.range)
  const tab = parseTab(search.tab)
  // Keys reset each section's boundaries, so a new range or tab shows its
  // skeleton instead of the previous numbers.
  return (
    <div className="space-y-8">
      <AnalyticsSection
        key={`overview-${range}`}
        title="the totals"
        fallback={<StatCardsSkeleton />}
      >
        <OverviewSection siteId={site.id} range={range} />
      </AnalyticsSection>

      <section aria-labelledby="chart-heading">
        <h2 id="chart-heading" className="sr-only">
          Visitors over time
        </h2>
        <AnalyticsSection
          key={`chart-${range}`}
          title="the chart"
          fallback={<ChartSkeleton />}
        >
          <ChartSection siteId={site.id} range={range} />
        </AnalyticsSection>
      </section>

      <section aria-labelledby="breakdown-heading" className="space-y-4">
        <h2 id="breakdown-heading" className="sr-only">
          Top sources, pages, countries and devices
        </h2>
        <BreakdownTabs siteId={site.id} range={range} active={tab} />
        <AnalyticsSection
          key={`breakdown-${range}-${tab}`}
          title="the breakdown"
          fallback={<BreakdownSkeleton />}
        >
          <BreakdownSection siteId={site.id} range={range} by={tab} />
        </AnalyticsSection>
      </section>
    </div>
  )
}
