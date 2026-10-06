import type { Site } from "@workspace/contracts"
import { ArrowUpRight, CalendarDays, ChartSpline, Earth } from "lucide-react"
import Link from "next/link"

import { Card } from "@/components/ui/card"
import { routes } from "@/lib/routes"

import { SiteBanner } from "./site-banner"
import { SiteFavicon } from "./site-favicon"

const since = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

type SiteProfileCardProps = {
  site: Site
  /** The numbers row ("1,204 Visitors"), streamed in on its own. */
  stats: React.ReactNode
}

/**
 * A site as a profile, like a post author's card on X: banner, the site's
 * own icon overlapping it, its name and domain, when tracking started, and
 * its numbers where followers would be.
 */
export function SiteProfileCard({ site, stats }: SiteProfileCardProps) {
  const showName = site.name.trim() && site.name !== site.domain
  return (
    <Card className="overflow-hidden transition-colors hover:border-accent/50">
      <Link
        href={routes.site(site.id)}
        aria-label={`Open the dashboard of ${site.domain}`}
        className="block"
      >
        <SiteBanner siteId={site.id} className="h-28" />
      </Link>
      <div className="px-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="-mt-9 rounded-2xl bg-surface p-1 ring-1 ring-border">
            <SiteFavicon
              siteId={site.id}
              domain={site.domain}
              className="size-16 rounded-xl text-2xl"
            />
          </div>
          <div className="flex items-center gap-2 pt-3">
            <a
              href={`https://${site.domain}`}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`Visit ${site.domain}`}
              title={`Visit ${site.domain}`}
              className="inline-grid size-11 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-9"
            >
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
            <Link
              href={routes.site(site.id)}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90 sm:h-9"
            >
              <ChartSpline aria-hidden="true" className="size-4" />
              Dashboard
            </Link>
          </div>
        </div>

        <h2 className="mt-3 truncate text-lg leading-tight font-semibold">
          {showName ? site.name : site.domain}
        </h2>
        <p className="truncate text-sm text-muted-foreground">
          {showName ? site.domain : "Website"}
        </p>

        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-4" />
            Tracking since {since.format(new Date(site.createdAt))}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Earth aria-hidden="true" className="size-4" />
            {site.timezone}
          </span>
        </p>

        <div className="mt-3">{stats}</div>
      </div>
    </Card>
  )
}
