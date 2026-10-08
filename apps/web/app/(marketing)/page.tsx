import type { Metadata } from "next"

import { HowItWorks } from "@/features/marketing/components/how-it-works"
import { Faq } from "@/features/marketing/components/faq"
import { FeatureRows } from "@/features/marketing/components/feature-rows"
import { Hero } from "@/features/marketing/components/hero"
import { Pricing } from "@/features/marketing/components/pricing"
import { Section } from "@/features/marketing/components/section"
import { PendingSectionScroll } from "@/features/marketing/components/section-link"
import { SpotsMarquee } from "@/features/marketing/components/spots-marquee"

export const metadata: Metadata = {
  title: "Web analytics that shows you who's visiting",
  description:
    "See the people behind your pageviews: who's on your site right now and where they came from. Every visitor gets a name.",
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <SpotsMarquee />
      <FeatureRows />
      <HowItWorks />
      <Pricing />
      <Section tone="alt" id="faq" labelledBy="faq-title">
        <Faq />
      </Section>
      <PendingSectionScroll />
    </>
  )
}
