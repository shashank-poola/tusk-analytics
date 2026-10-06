"use client"

import type { InstallStatus } from "@workspace/contracts"
import Link from "next/link"

import { routes } from "@/lib/routes"

import { useInstallStatus } from "./use-install-status"

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
    return (
      <section
        role="status"
        className="max-w-2xl rounded-lg border border-neutral-200 p-6"
      >
        <h2 className="flex items-center gap-2 font-medium">
          <span aria-hidden className="size-2 rounded-full bg-green-600" />
          Connected
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Viewtally received the first pageview from {domain}.
        </p>
        <Link
          href={routes.site(siteId)}
          className="mt-4 inline-flex rounded-full bg-neutral-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          View analytics
        </Link>
      </section>
    )
  }

  const timedOut = check.state === "timed_out"
  return (
    <section
      aria-live="polite"
      className="max-w-2xl rounded-lg border border-neutral-200 p-6"
    >
      <h2 className="flex items-center gap-2 font-medium">
        <span
          aria-hidden
          className={`size-2 rounded-full bg-amber-500 ${timedOut ? "" : "animate-pulse"}`}
        />
        Waiting for the first visit
      </h2>
      <p className="mt-1 text-sm text-neutral-500">
        {timedOut
          ? "We stopped checking after 5 minutes. Reload this page to check again."
          : "Open your site in another tab. This updates by itself when the pageview arrives."}
      </p>
      {(timedOut || check.showChecklist) && <Checklist domain={domain} />}
    </section>
  )
}

function Checklist({ domain }: { domain: string }) {
  return (
    <div className="mt-4 border-t border-neutral-200 pt-4">
      <h3 className="text-sm font-medium">No data yet? Check that:</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
        <li>
          The snippet is inside the &lt;head&gt; of your pages (or your root
          layout in Next.js), and that version is deployed.
        </li>
        <li>
          You opened {domain} or www.{domain} exactly. Other subdomains and
          preview URLs are ignored.
        </li>
        <li>
          No ad blocker is blocking the script. Try a private window with
          extensions off.
        </li>
        <li>
          Your browser isn&apos;t showing a cached page. Hard refresh with
          Ctrl+Shift+R (Cmd+Shift+R on a Mac).
        </li>
      </ul>
    </div>
  )
}
