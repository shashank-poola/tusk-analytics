import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow"
import { getSite } from "@/features/sites/server/sites.queries"
import { scriptUrl } from "@/lib/env"

// getSite is cached per request, so the page reuses this lookup.
export async function generateMetadata({
  params,
}: PageProps<"/onboarding/[siteId]">): Promise<Metadata> {
  const site = await getSite((await params).siteId)
  if (!site) notFound()
  return { title: `Install on ${site.domain}` }
}

/** The same one-card onboarding, resumed at the install step. */
export default async function InstallSnippetPage({
  params,
}: PageProps<"/onboarding/[siteId]">) {
  const site = await getSite((await params).siteId)
  if (!site) notFound()
  return (
    <OnboardingFlow
      scriptUrl={scriptUrl()}
      initialSite={{ id: site.id, domain: site.domain }}
    />
  )
}
