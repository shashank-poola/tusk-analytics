import { SITE_LIST_MAX_LIMIT } from "@workspace/contracts"
import { Compass, LayoutDashboard, Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Card } from "@/components/ui/card"
import { SiteFavicon } from "@/features/sites/components/site-favicon"
import { listSites } from "@/features/sites/server/sites.queries"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Your sites · Viewtally",
}

const startedOn = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

const BUTTON_CLASSES =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors"
const PRIMARY_CLASSES = `${BUTTON_CLASSES} bg-accent font-semibold text-accent-foreground hover:opacity-90`

/** Every website the signed-in user tracks; `/site/<id>` is one of them. */
export default async function SitesPage() {
  const sites = await listSites({ limit: SITE_LIST_MAX_LIMIT })
  if (sites.length === 0) redirect(routes.onboarding)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Your sites</h1>
        <Link href={routes.onboarding} className={PRIMARY_CLASSES}>
          <Plus aria-hidden="true" className="size-4" />
          Add site
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <li key={site.id}>
            <Card className="overflow-hidden">
              <Link
                href={routes.site(site.id)}
                aria-label={`Open ${site.domain}`}
                className="grid h-28 place-items-center bg-accent-soft"
              >
                <SiteFavicon
                  siteId={site.id}
                  domain={site.domain}
                  className="size-12 rounded-xl"
                />
              </Link>
              <div className="space-y-4 p-4">
                <p className="text-sm text-muted-foreground">
                  Tracking{" "}
                  <span className="font-semibold text-foreground">
                    {site.domain}
                  </span>{" "}
                  since {startedOn.format(new Date(site.createdAt))}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={routes.site(site.id)} className={PRIMARY_CLASSES}>
                    <LayoutDashboard aria-hidden="true" className="size-4" />
                    Open dashboard
                  </Link>
                  <a
                    href={`https://${site.domain}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`${BUTTON_CLASSES} border border-border hover:bg-muted`}
                  >
                    <Compass aria-hidden="true" className="size-4" />
                    View site
                  </a>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
