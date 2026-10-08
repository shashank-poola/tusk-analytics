"use client"

import type { InstallStatus } from "@workspace/contracts"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { BUTTON_CLASSES } from "@/components/ui/button-styles"
import { LiveDot } from "@/components/ui/live-dot"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { routes } from "@/lib/routes"

import { useInstallStatus } from "@/features/onboarding/hooks/use-install-status"
import { ConfettiBurst } from "./confetti-burst"
import { InstallChecklist } from "./install-checklist"

/** How long the celebration shows before the real dashboard loads. */
const CELEBRATE_MS = 3500

type FirstVisitWatchProps = {
  siteId: string
  domain: string
  initialStatus: InstallStatus
}

/**
 * Sits on top of the waiting dashboard: asks the owner to open their site,
 * checks every few seconds, and when the first visit lands, throws a
 * party (confetti, Tusk jumping) and loads the real dashboard. One status
 * region stays mounted and only its content changes, so screen readers
 * announce the arrival.
 */
export function FirstVisitWatch({
  siteId,
  domain,
  initialStatus,
}: FirstVisitWatchProps) {
  const check = useInstallStatus(siteId, initialStatus)
  const router = useRouter()
  const reducedMotion = usePrefersReducedMotion()
  const arrived = check.state === "connected"

  useEffect(() => {
    if (!arrived) return
    const timer = setTimeout(() => router.refresh(), CELEBRATE_MS)
    return () => clearTimeout(timer)
  }, [arrived, router])

  return (
    <>
      {arrived && !reducedMotion && <ConfettiBurst />}
      <div role="status">
        {arrived ? (
          <Celebration domain={domain} onContinue={() => router.refresh()} />
        ) : (
          <Waiting
            siteId={siteId}
            domain={domain}
            timedOut={check.state === "timed_out"}
            showChecklist={
              check.state === "timed_out" ||
              (check.state === "waiting" && check.showChecklist)
            }
          />
        )}
      </div>
    </>
  )
}

function Celebration({
  domain,
  onContinue,
}: {
  domain: string
  onContinue: () => void
}) {
  return (
    <section className="flex flex-col items-center gap-5 rounded-[1.25rem] border-2 border-accent bg-surface p-6 text-center sm:flex-row sm:text-left">
      <Image
        src="/mascot/hippocelebration.png"
        alt="Tusk the hippo jumping for joy in confetti"
        width={112}
        height={112}
        className="size-28 shrink-0 motion-safe:animate-jump"
      />
      <div className="flex-1">
        <h1 className="text-2xl leading-tight">
          Your first visitor just showed up.
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Tusk is counting {domain}. Your numbers are loading now.
        </p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className={BUTTON_CLASSES.primary}
      >
        See your dashboard
      </button>
    </section>
  )
}

type WaitingProps = {
  siteId: string
  domain: string
  timedOut: boolean
  showChecklist: boolean
}

function Waiting({ siteId, domain, timedOut, showChecklist }: WaitingProps) {
  return (
    <section className="rounded-[1.25rem] border-2 border-border bg-surface p-6">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <Image
          src="/mascot/tealbucket.png"
          alt="Pip the baby hippo, waiting with a bucket"
          width={96}
          height={96}
          className="size-24 shrink-0"
        />
        <div className="flex-1">
          <h1 className="text-2xl leading-tight">
            {timedOut
              ? "Still waiting for your first visitor"
              : "Waiting for your first visitor"}
          </h1>
          <p className="mt-1.5 text-muted-foreground">
            {timedOut
              ? "We stopped checking after 5 minutes. Reload this page to check again."
              : `Open ${domain} in a new tab. You'll show up here within a few seconds.`}
          </p>
          {!timedOut && (
            <p className="mt-2 inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
              <LiveDot />
              Listening for visits
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <a
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className={BUTTON_CLASSES.primary}
          >
            Open {domain}
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
          <Link
            href={routes.installSnippet(siteId)}
            className="text-[13px] font-semibold text-link underline-offset-4 hover:underline"
          >
            See the install snippet
          </Link>
        </div>
      </div>
      {showChecklist && <InstallChecklist domain={domain} />}
    </section>
  )
}
