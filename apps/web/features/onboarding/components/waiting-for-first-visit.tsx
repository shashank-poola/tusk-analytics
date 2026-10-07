import type { InstallStatus, Site } from "@workspace/contracts"
import Link from "next/link"

import { routes } from "@/lib/routes"

import { VerifyInstallation } from "./verify-installation"

type WaitingForFirstVisitProps = { site: Site; initialStatus: InstallStatus }

/** The site page before any event: the verify panel and the way back. */
export function WaitingForFirstVisit({
  site,
  initialStatus,
}: WaitingForFirstVisitProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl leading-tight">
          Almost there: {site.domain} hasn&apos;t sent a visit yet.
        </h1>
        <p className="text-sm text-muted-foreground">
          Your analytics appear here as soon as it does.{" "}
          <Link
            href={routes.installSnippet(site.id)}
            className="font-medium text-link underline-offset-4 hover:underline"
          >
            See the install snippet
          </Link>
        </p>
      </div>
      <VerifyInstallation
        siteId={site.id}
        domain={site.domain}
        initialStatus={initialStatus}
      />
    </div>
  )
}
