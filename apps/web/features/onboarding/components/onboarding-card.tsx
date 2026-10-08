import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { OnboardingProgress } from "./onboarding-progress"

type OnboardingCardProps = {
  step: 1 | 2
  title: React.ReactNode
  description: string
  /** A way out, e.g. back to the dashboard for people who already have sites. */
  back?: { href: string; label: string }
  children: React.ReactNode
}

/** One centered card per onboarding step, the progress bar on top. */
export function OnboardingCard({
  step,
  title,
  description,
  back,
  children,
}: OnboardingCardProps) {
  return (
    <div className="mx-auto w-full max-w-xl">
      {back && (
        <Link
          href={back.href}
          className="mb-6 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      )}
      <OnboardingProgress step={step} />
      <section
        aria-labelledby="onboarding-title"
        className="mt-6 rounded-[1.25rem] border-2 border-border bg-surface p-5 sm:p-7"
      >
        <h1 id="onboarding-title" className="text-2xl leading-tight">
          {title}
        </h1>
        <p className="mt-2 mb-6 text-muted-foreground">{description}</p>
        {children}
      </section>
    </div>
  )
}
