import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { InstallPanel } from "@/features/onboarding/components/install-panel"
import { OnboardingCard } from "@/features/onboarding/components/onboarding-card"
import { SiteFavicon } from "@/features/sites/components/site-favicon"
import { getSite } from "@/features/sites/server/sites.queries"
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

  const snippet = { siteId: site.id, scriptUrl: scriptUrl() }
  return (
    <OnboardingCard
      step={2}
      title={
        <span className="flex items-center gap-2.5">
          <SiteFavicon siteId={site.id} domain={site.domain} />
          Install Tusk on {site.domain}
        </span>
      }
      description="Pick how your site is built. It takes about a minute."
      back={{ href: routes.site(site.id), label: "Dashboard" }}
    >
      <InstallPanel
        snippets={{
          standard: buildSnippets(snippet),
          cookieless: buildSnippets({ ...snippet, cookieless: true }),
        }}
        continueHref={routes.site(site.id)}
      />
    </OnboardingCard>
  )
}
