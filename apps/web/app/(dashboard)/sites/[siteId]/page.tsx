import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  parseDeviceTab,
  parseRange,
} from "@/features/analytics/analytics-params"
import { AnalyticsSection } from "@/features/analytics/analytics-section"
import {
  BreakdownSection,
  ChartSection,
  GreetingSection,
  HighlightsSection,
  KpiSection,
} from "@/features/analytics/analytics-sections"
import { BreakdownCard } from "@/features/analytics/breakdown-card"
import { ChartCard } from "@/features/analytics/chart-card"
import { DeviceTabs } from "@/features/analytics/device-tabs"
import { RangePicker } from "@/features/analytics/range-picker"
import {
  BreakdownSkeleton,
  ChartSkeleton,
  GreetingSkeleton,
  HighlightsSkeleton,
  KpiCardsSkeleton,
} from "@/features/analytics/skeletons"
import { WaitingForFirstVisit } from "@/features/onboarding/waiting-for-first-visit"
import { getInstallStatus, getSite } from "@/features/sites/sites.queries"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Site · Viewtally",
}

const BREAKDOWNS = [
  { title: "Sources", by: "source" },
  { title: "Pages", by: "page" },
  { title: "Countries", by: "country" },
] as const

export default async function SitePage({
  params,
  searchParams,
}: PageProps<"/sites/[siteId]">) {
  const [{ siteId }, search, session] = await Promise.all([
    params,
    searchParams,
    getSession(),
  ])
  const site = await getSite(siteId)
  if (!site) notFound()

  const installStatus = await getInstallStatus(site.id)
  if (!installStatus.connected) {
    return <WaitingForFirstVisit site={site} initialStatus={installStatus} />
  }

  const range = parseRange(search.range)
  const tab = parseDeviceTab(search.tab)
  const section = { siteId: site.id, range }
  // Keys reset a section's boundaries, so a new range or tab shows its
  // skeleton (and replays the count-up) instead of stale numbers.
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AnalyticsSection
          key={`greeting-${range}`}
          title="the summary"
          fallback={<GreetingSkeleton />}
        >
          <GreetingSection
            {...section}
            name={session?.user.name ?? null}
            domain={site.domain}
          />
        </AnalyticsSection>
        <RangePicker siteId={site.id} range={range} tab={tab} />
      </div>

      <section aria-label="Totals">
        <AnalyticsSection
          key={`kpis-${range}`}
          title="the totals"
          fallback={<KpiCardsSkeleton />}
        >
          <KpiSection {...section} />
        </AnalyticsSection>
      </section>

      <ChartCard>
        <AnalyticsSection
          key={`chart-${range}`}
          title="the chart"
          fallback={<ChartSkeleton />}
        >
          <ChartSection {...section} />
        </AnalyticsSection>
      </ChartCard>

      <AnalyticsSection
        key={`highlights-${range}`}
        title="the highlights"
        fallback={<HighlightsSkeleton />}
      >
        <HighlightsSection {...section} />
      </AnalyticsSection>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {BREAKDOWNS.map(({ title, by }) => (
          <BreakdownCard key={by} title={title}>
            <AnalyticsSection
              key={`${by}-${range}`}
              title={title.toLowerCase()}
              fallback={<BreakdownSkeleton />}
            >
              <BreakdownSection {...section} by={by} title={title} />
            </AnalyticsSection>
          </BreakdownCard>
        ))}
        <BreakdownCard
          title="Devices"
          tabs={<DeviceTabs siteId={site.id} range={range} active={tab} />}
        >
          <AnalyticsSection
            key={`${tab}-${range}`}
            title="devices"
            fallback={<BreakdownSkeleton />}
          >
            <BreakdownSection {...section} by={tab} title="Devices" />
          </AnalyticsSection>
        </BreakdownCard>
      </div>
    </div>
  )
}
