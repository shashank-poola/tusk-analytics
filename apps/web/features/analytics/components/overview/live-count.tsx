"use client"

import { startTransition, useEffect, useState } from "react"

import { formatNumber } from "@/features/analytics/utils/format"
import { checkLiveVisitors } from "@/features/analytics/server/live-visitors-action"

export const LIVE_POLL_INTERVAL_MS = 30_000

type LiveCountProps = { siteId: string; initialCount: number }

/**
 * Visitors right now, refreshed every 30 seconds while the tab is visible.
 * Polls one at a time; a failed check keeps the last number.
 */
export function LiveCount({ siteId, initialCount }: LiveCountProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function poll() {
      if (document.visibilityState === "visible") {
        try {
          const visitors = await checkLiveVisitors(siteId)
          if (!stopped) setCount(visitors)
        } catch (error) {
          console.error(`Checking live visitors for ${siteId} failed`, error)
        }
      }
      if (!stopped) schedule()
    }

    function schedule() {
      timer = setTimeout(() => startTransition(poll), LIVE_POLL_INTERVAL_MS)
    }

    schedule()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [siteId])

  return (
    <span className="inline-flex items-center gap-2">
      {formatNumber(count)}
      <span className="sr-only">
        {count === 1 ? "visitor" : "visitors"} on the site right now
      </span>
    </span>
  )
}
