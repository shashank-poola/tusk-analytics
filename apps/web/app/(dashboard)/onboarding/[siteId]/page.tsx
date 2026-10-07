import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { InstallSnippet } from "@/features/onboarding/components/install-snippet"
import { VerifyInstallation } from "@/features/onboarding/components/verify-installation"
import {
  getInstallStatus,
  getSite,
} from "@/features/sites/server/sites.queries"
import { scriptUrl } from "@/lib/env"
import { routes } from "@/lib/routes"
import { buildSnippets } from "@/features/onboarding/utils/snippets"

// getSite is cached per request, so the page reuses this lookup.
export async function generateMetadata({
  params,
}: PageProps<"/onboarding/[siteId]">): Promise<Metadata> {
  const site = await getSite((await params).siteId)
  if (!site) notFound()
  return { title: `Install on ${site.domain}` }
}

export default async function InstallSnippetPage({
  params,
}: PageProps<"/onboarding/[siteId]">) {
  const site = await getSite((await params).siteId)
  if (!site) notFound()
  const installStatus = await getInstallStatus(site.id)

  return (
    <>
      <h1 className="text-2xl leading-tight">Install Tusk on {site.domain}</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        Add this script to your site. It&apos;s small and loads without blocking
        your pages.
      </p>
      <InstallSnippet
        snippets={buildSnippets({ siteId: site.id, scriptUrl: scriptUrl() })}
        continueHref={routes.site(site.id)}
      />
      <div className="mt-10">
        <VerifyInstallation
          siteId={site.id}
          domain={site.domain}
          initialStatus={installStatus}
        />
      </div>
    </>
  )
}
