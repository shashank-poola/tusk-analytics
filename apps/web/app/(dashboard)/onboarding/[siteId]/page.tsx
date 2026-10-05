import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { InstallSnippet } from "@/features/onboarding/install-snippet"
import { getSite } from "@/features/sites/sites.queries"
import { scriptUrl } from "@/lib/env"
import { routes } from "@/lib/routes"
import { buildSnippets } from "@/lib/snippets"

export const metadata: Metadata = {
  title: "Install Viewtally · Viewtally",
}

export default async function InstallSnippetPage({
  params,
}: PageProps<"/onboarding/[siteId]">) {
  const site = await getSite((await params).siteId)
  if (!site) notFound()

  return (
    <>
      <h1 className="text-2xl font-normal tracking-tight">
        Install Viewtally on {site.domain}
      </h1>
      <p className="mt-2 mb-8 text-sm text-neutral-500">
        Add this script to your site. It&apos;s small and loads without blocking
        your pages.
      </p>
      <InstallSnippet
        snippets={buildSnippets({ siteId: site.id, scriptUrl: scriptUrl() })}
        continueHref={routes.site(site.id)}
      />
    </>
  )
}
