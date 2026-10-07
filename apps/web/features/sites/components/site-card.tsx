import type { Site } from "@workspace/contracts"
import Link from "next/link"

import { routes } from "@/lib/routes"

import { SiteFavicon } from "./site-favicon"

type SiteCardProps = {
  site: Site
  /** The sparkline and visitor count, streamed in on their own. */
  children: React.ReactNode
}

/**
 * One site on /sites, as DataFast's. The whole card opens its dashboard:
 * the name's link stretches over it, so the card stays a plain block and
 * its contents (a retry button if loading fails) stay valid inside it.
 */
export function SiteCard({ site, children }: SiteCardProps) {
  return (
    <div className="relative rounded-2xl border-2 border-border bg-surface p-5 transition-colors focus-within:border-accent hover:border-muted-foreground/40 hover:bg-muted/30">
      <div className="flex items-center gap-2.5">
        <SiteFavicon siteId={site.id} domain={site.domain} />
        <Link
          href={routes.site(site.id)}
          className="truncate font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl"
        >
          {site.domain}
        </Link>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}
