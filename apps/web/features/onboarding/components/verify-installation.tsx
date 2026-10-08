"use client"

import type { InstallStatus } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { LogoMark } from "@/components/brand/logo"
import { BUTTON_CLASSES } from "@/components/ui/button-styles"
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
          <LogoMark
            className={cn(
              "size-16 bg-accent-soft",
              celebrate && "animate-jump"
            )}
          />
          <div>
            <h2 className="text-lg leading-snug">
              {celebrate ? "Your first visitor just showed up." : "Connected"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tusk received the first pageview from {domain}.
            </p>
            <Link
              href={routes.site(siteId)}
              className={cn(BUTTON_CLASSES.primary, "mt-4")}
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
        <LogoMark className="size-16" />
        <div>
          <h2 className="text-lg leading-snug">Waiting for the first visit</h2>
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
