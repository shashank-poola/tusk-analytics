"use client"

import type { InstallStatus } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { TallyMarks } from "@/components/brand/tally-marks"
import { Card } from "@/components/ui/card"
import { routes } from "@/lib/routes"

import { InstallChecklist } from "./install-checklist"
import { useInstallStatus } from "@/features/onboarding/hooks/use-install-status"

type VerifyInstallationProps = {
  siteId: string
  domain: string
  initialStatus: InstallStatus
}

/** Waits for the site's first pageview and says when it arrived. */
export function VerifyInstallation({
  siteId,
  domain,
  initialStatus,
}: VerifyInstallationProps) {
  const check = useInstallStatus(siteId, initialStatus)

  if (check.state === "connected") {
    // Only a flip seen on this page celebrates: after a reload the status
    // starts out connected, so it never replays.
    const celebrate = !initialStatus.connected
    return (
      <Card role="status" className="max-w-2xl p-6">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl",
              celebrate
                ? "bg-highlight/20 text-foreground"
                : "bg-accent-soft text-accent"
            )}
          >
            <TallyMarks animate={celebrate} className="size-7" />
          </span>
          <div>
            <h2 className="font-medium">
              {celebrate ? "You're live! First visit counted." : "Connected"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Viewtally received the first pageview from {domain}.
            </p>
            <Link
              href={routes.site(siteId)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 sm:min-h-9"
            >
              View analytics
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  const timedOut = check.state === "timed_out"
  return (
    <Card aria-live="polite" className="max-w-2xl p-6">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <TallyMarks className="size-7 opacity-40" />
        </span>
        <div>
          <h2 className="font-medium">Waiting for the first visit</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {timedOut
              ? "We stopped checking after 5 minutes. Reload this page to check again."
              : "Open your site in another tab. This updates by itself, checking every few seconds."}
          </p>
        </div>
      </div>
      {(timedOut || check.showChecklist) && (
        <InstallChecklist domain={domain} />
      )}
    </Card>
  )
}
