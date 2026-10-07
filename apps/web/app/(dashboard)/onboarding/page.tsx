import type { Metadata } from "next"
import { cookies } from "next/headers"

import { AddSiteForm } from "@/features/onboarding/components/add-site-form"
import { parseSignupDomain, SIGNUP_DOMAIN_COOKIE } from "@/lib/signup-domain"

export const metadata: Metadata = {
  title: "Add a site",
}

export default async function OnboardingPage() {
  // The domain typed on the landing page, if any, fills the form in.
  const signupDomain = parseSignupDomain(
    (await cookies()).get(SIGNUP_DOMAIN_COOKIE)?.value
  )
  return (
    <>
      <h1 className="text-2xl leading-tight">Add your site</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        Tell us where Tusk will run. You&apos;ll get the install snippet next.
      </p>
      <AddSiteForm defaultDomain={signupDomain} />
    </>
  )
}
