import { SITE_LIST_MAX_LIMIT } from "@workspace/contracts"
import { Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { TallyMarks } from "@/components/brand/tally-marks"
import { SectionBoundary } from "@/features/analytics/components/section-boundary"
import {
  SiteCardStats,
  SiteCardStatsSkeleton,
} from "@/features/analytics/components/site-card-stats"
import { SiteProfileCard } from "@/features/sites/components/site-profile-card"
import { listSites } from "@/features/sites/server/sites.queries"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Your sites · Viewtally",
}

/**
 * Every website the signed-in user tracks, each as a profile card;
 * `/site/<id>` is one site's dashboard. Each card's numbers stream in on
 * their own, so one slow site doesn't hold up the page.
 */
export default async function SitesPage() {
  const sites = await listSites({ limit: SITE_LIST_MAX_LIMIT })
  if (sites.length === 0) redirect(routes.onboarding)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-accent">
            <TallyMarks className="size-4" strokeWidth={2.5} />
            {sites.length === 1 ? "1 website" : `${sites.length} websites`}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Your sites
          </h1>
        </div>
        <Link
          href={routes.onboarding}
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 sm:h-9"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add site
        </Link>
      </header>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <li key={site.id}>
            <SiteProfileCard
              site={site}
              stats={
                <SectionBoundary
                  title="the numbers"
                  fallback={<SiteCardStatsSkeleton />}
                >
                  <SiteCardStats siteId={site.id} />
                </SectionBoundary>
              }
            />
          </li>
        ))}
        <li>
          <Link
            href={routes.onboarding}
            className="flex h-full min-h-72 flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-border p-6 text-center transition-colors hover:border-accent/60 hover:bg-accent-soft/40"
          >
            <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
              <Plus aria-hidden="true" className="size-5" />
            </span>
            <span className="font-semibold">Add a website</span>
            <span className="max-w-56 text-sm text-muted-foreground">
              Paste one script tag and see visitors in a minute.
            </span>
          </Link>
        </li>
      </ul>
    </div>
  )
}
