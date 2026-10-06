import { SITE_LIST_MAX_LIMIT } from "@workspace/contracts"
import { Plus } from "lucide-react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { SectionBoundary } from "@/features/analytics/components/section-boundary"
import {
  SiteSparkline,
  SiteSparklineSkeleton,
} from "@/features/analytics/components/site-sparkline"
import { SitesVisitorTotal } from "@/features/analytics/components/sites-visitor-total"
import { SiteCard } from "@/features/sites/components/site-card"
import { SitesRangeMenu } from "@/features/sites/components/sites-range-menu"
import { listSites } from "@/features/sites/server/sites.queries"
import {
  parseSitesRange,
  sitesPeriod,
} from "@/features/sites/utils/sites-range"
import { routes } from "@/lib/routes"
import { getSession } from "@/lib/session"
import { SITES_RANGE_COOKIE } from "@/lib/view-cookie"

export const metadata: Metadata = {
  title: "Your sites · Viewtally",
}

/**
 * Every website the signed-in user tracks, as DataFast lists them: a
 * greeting with the total visitors, then one card per site with its
 * visitors as a sparkline. `/site/<id>` is one site's dashboard.
 */
export default async function SitesPage() {
  const [sites, session, jar] = await Promise.all([
    listSites({ limit: SITE_LIST_MAX_LIMIT }),
    getSession(),
    cookies(),
  ])
  if (sites.length === 0) redirect(routes.onboarding)

  const range = parseSitesRange(jar.get(SITES_RANGE_COOKIE)?.value)
  const period = sitesPeriod(range)
  const name = session?.user.name?.trim()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        {/* A div, not a <p>: the period menu is a <details>. */}
        <div className="text-lg text-muted-foreground">
          Hey{name ? ` ${name}` : ""}, you got{" "}
          <SectionBoundary
            key={range}
            title="the total"
            fallback={<span className="text-foreground">…</span>}
          >
            <SitesVisitorTotal
              siteIds={sites.map((site) => site.id)}
              period={period}
            />
          </SectionBoundary>{" "}
          visitors in the <SitesRangeMenu range={range} />
        </div>
        <Link
          href={routes.onboarding}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition-colors hover:bg-muted sm:h-9"
        >
          <Plus aria-hidden="true" className="size-4" />
          Website
        </Link>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <li key={site.id}>
            <SiteCard site={site}>
              <SectionBoundary
                key={range}
                title="this site's visitors"
                fallback={<SiteSparklineSkeleton />}
              >
                <SiteSparkline siteId={site.id} period={period} />
              </SectionBoundary>
            </SiteCard>
          </li>
        ))}
      </ul>
    </div>
  )
}
