import type { Metadata } from "next"
import { cookies } from "next/headers"

import { AddSiteForm } from "@/features/onboarding/components/add-site-form"
import { OnboardingCard } from "@/features/onboarding/components/onboarding-card"
import { listSites } from "@/features/sites/server/sites.queries"
import { routes } from "@/lib/routes"
import { parseSignupDomain, SIGNUP_DOMAIN_COOKIE } from "@/lib/signup-domain"

export const metadata: Metadata = {
  title: "Add a site",
}

export default async function OnboardingPage() {
  const [jar, sites] = await Promise.all([cookies(), listSites({ limit: 1 })])
  // The domain typed on the landing page, if any, fills the form in.
  const signupDomain = parseSignupDomain(jar.get(SIGNUP_DOMAIN_COOKIE)?.value)
  return (
    <OnboardingCard
      step={1}
      title="Add your site"
      description="Tell us where Tusk will run. The install snippet comes next."
      back={
        sites.length > 0
          ? { href: routes.sites, label: "Your sites" }
          : undefined
      }
    >
      <AddSiteForm defaultDomain={signupDomain} />
    </OnboardingCard>
  )
}
