import type { Metadata } from "next"
import { cookies } from "next/headers"

import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow"
import { scriptUrl } from "@/lib/env"
import { parseSignupDomain, SIGNUP_DOMAIN_COOKIE } from "@/lib/signup-domain"

export const metadata: Metadata = {
  title: "Add a site",
}

export default async function OnboardingPage() {
  // The domain typed on the landing page, if any, fills the form in.
  const signupDomain = parseSignupDomain(
    (await cookies()).get(SIGNUP_DOMAIN_COOKIE)?.value
  )
  return <OnboardingFlow scriptUrl={scriptUrl()} defaultDomain={signupDomain} />
}
