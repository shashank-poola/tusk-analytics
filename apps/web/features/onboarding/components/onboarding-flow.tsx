"use client"

import type { Site } from "@workspace/contracts"
import { useState } from "react"

import { routes } from "@/lib/routes"

import { SiteFavicon } from "@/features/sites/components/site-favicon"
import { buildSnippets } from "@/features/onboarding/utils/snippets"
import { AddSiteForm } from "./add-site-form"
import { InstallPanel } from "./install-panel"
import { OnboardingProgress } from "./onboarding-progress"

type OnboardingSite = Pick<Site, "id" | "domain">

type OnboardingFlowProps = {
  /** Where the tracker script is served; the snippets point at it. */
  scriptUrl: string
  /** Typed on the landing page before sign-in. */
  defaultDomain?: string
  /** Set when resuming: the site exists and needs its script. */
  initialSite?: OnboardingSite
}

/**
 * Onboarding in one card on one page: add the site, then install the
 * script, the card switching in place. The address becomes
 * /onboarding/<id> once the site exists, so a reload or a later sign-in
 * resumes at the install step. The page itself never scrolls; a long tab
 * scrolls inside the card.
 */
export function OnboardingFlow({
  scriptUrl,
  defaultDomain,
  initialSite,
}: OnboardingFlowProps) {
  const [site, setSite] = useState(initialSite)

  function handleAdded(added: OnboardingSite) {
    setSite(added)
    window.history.replaceState(null, "", routes.installSnippet(added.id))
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-7rem)] w-full max-w-lg flex-col justify-start gap-5 pt-[6svh] sm:h-[calc(100svh-9rem)] sm:pt-[10svh]">
      <OnboardingProgress step={site ? 2 : 1} />
      <section
        aria-labelledby="onboarding-title"
        className="flex min-h-0 flex-col rounded-[1.25rem] border-2 border-border bg-surface"
      >
        <header className="px-5 pt-5 sm:px-6 sm:pt-6">
          <h1
            id="onboarding-title"
            className="flex items-center gap-2.5 text-xl leading-tight"
          >
            {site && <SiteFavicon siteId={site.id} domain={site.domain} />}
            {site ? `Install Tusk on ${site.domain}` : "Add your site"}
          </h1>
        </header>
        <div
          key={site ? "install" : "add"}
          className="min-h-0 animate-rise overflow-y-auto px-5 pt-5 pb-5 sm:px-6 sm:pb-6"
        >
          {site ? (
            <InstallPanel
              snippets={{
                standard: buildSnippets({ siteId: site.id, scriptUrl }),
                cookieless: buildSnippets({
                  siteId: site.id,
                  scriptUrl,
                  cookieless: true,
                }),
              }}
              continueHref={routes.site(site.id)}
            />
          ) : (
            <AddSiteForm defaultDomain={defaultDomain} onAdded={handleAdded} />
          )}
        </div>
      </section>
    </div>
  )
}
