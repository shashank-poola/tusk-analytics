import { SITE_LIST_MAX_LIMIT } from "@workspace/contracts"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { DateRangePicker } from "@/features/analytics/date-range-picker"
import { SiteSwitcher } from "@/features/sites/site-switcher"
import {
  getInstallStatus,
  getSite,
  listSites,
} from "@/features/sites/sites.queries"

export default async function SiteLayout({
  children,
  params,
}: LayoutProps<"/sites/[siteId]">) {
  const { siteId } = await params
  const [site, sites] = await Promise.all([
    getSite(siteId),
    listSites({ limit: SITE_LIST_MAX_LIMIT }),
  ])
  if (!site) notFound()
  const installStatus = await getInstallStatus(site.id)

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* Keyed so the menu closes after switching sites. */}
          <SiteSwitcher key={site.id} current={site} sites={sites} />
          <p className="mt-1 text-sm text-muted-foreground">{site.domain}</p>
        </div>
        {/* Nothing to pick a range for until the first event. Suspense:
            useSearchParams needs a boundary. */}
        {installStatus.connected && (
          <Suspense>
            <DateRangePicker />
          </Suspense>
        )}
      </div>
      <div className="mt-8">{children}</div>
    </>
  )
}
