import type { InstallStatus } from "@workspace/contracts"
import { startTransition, useEffect, useState } from "react"

import { checkInstallStatus } from "@/features/onboarding/server/install-status-action"

const POLL_INTERVAL_MS = 3_000
const POLL_TIMEOUT_MS = 5 * 60_000
const CHECKLIST_AFTER_MS = 60_000

type InstallCheck =
  | { state: "connected" }
  | { state: "waiting"; showChecklist: boolean }
  | { state: "timed_out" }

/**
 * Polls the site's install status every 3 seconds until the first event
 * arrives, for at most 5 minutes. Polls one at a time: the next check starts
 * 3 seconds after the previous one finished.
 */
export function useInstallStatus(
  siteId: string,
  initialStatus: InstallStatus
): InstallCheck {
  const [connected, setConnected] = useState(initialStatus.connected)
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    if (connected) return

    const startedAt = Date.now()
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function poll() {
      try {
        const status = await checkInstallStatus(siteId)
        if (stopped) return
        if (status.connected) {
          setConnected(true)
          return
        }
      } catch (error) {
        // A failed check (network blip, API restarting) is retried on the
        // next tick; the panel keeps saying it's waiting.
        console.error(`Checking install status for ${siteId} failed`, error)
      }
      if (stopped) return

      const elapsed = Date.now() - startedAt
      setElapsedMs(elapsed)
      if (elapsed < POLL_TIMEOUT_MS) schedule()
    }

    function schedule() {
      timer = setTimeout(() => startTransition(poll), POLL_INTERVAL_MS)
    }

    schedule()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [siteId, connected])

  if (connected) return { state: "connected" }
  if (elapsedMs >= POLL_TIMEOUT_MS) return { state: "timed_out" }
  return { state: "waiting", showChecklist: elapsedMs >= CHECKLIST_AFTER_MS }
}
