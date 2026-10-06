import type { Metadata } from "next"

import { AddSiteForm } from "@/features/onboarding/add-site-form"

export const metadata: Metadata = {
  title: "Add a site · Viewtally",
}

export default function OnboardingPage() {
  return (
    <>
      <h1 className="text-2xl font-normal tracking-tight">Add your site</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        Tell us where Viewtally will run. You&apos;ll get the install snippet
        next.
      </p>
      <AddSiteForm />
    </>
  )
}
