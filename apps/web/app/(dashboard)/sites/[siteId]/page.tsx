import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { VerifyInstallation } from "@/features/onboarding/verify-installation"
import { getInstallStatus, getSite } from "@/features/sites/sites.queries"

export const metadata: Metadata = {
  title: "Site · Viewtally",
}

export default async function SitePage({
  params,
}: PageProps<"/sites/[siteId]">) {
  const site = await getSite((await params).siteId)
  if (!site) notFound()
  const installStatus = await getInstallStatus(site.id)

  return (
    <>
      <h1 className="text-2xl font-normal tracking-tight">{site.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">{site.domain}</p>
      <div className="mt-8">
        {installStatus.connected ? (
          <p className="text-sm text-neutral-500">
            Viewtally is receiving pageviews. Charts will appear here soon.
          </p>
        ) : (
          <VerifyInstallation
            siteId={site.id}
            domain={site.domain}
            initialStatus={installStatus}
          />
        )}
      </div>
    </>
  )
}
