"use client"

import { cn } from "@workspace/ui/lib/utils"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useTransition } from "react"

import { CHIP_CLASSES } from "./chip"

/** How often a live period ("Now") refreshes itself. */
export const LIVE_REFRESH_MS = 60_000

type RefreshButtonProps = {
  /** Refresh every minute too, while the tab is visible: for "Now". */
  live?: boolean
}

/** Refetches every section without leaving the page or losing scroll. */
export function RefreshButton({ live = false }: RefreshButtonProps) {
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()

  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        startRefresh(() => router.refresh())
      }
    }, LIVE_REFRESH_MS)
    return () => clearInterval(timer)
  }, [live, router])

  return (
    <button
      type="button"
      onClick={() => startRefresh(() => router.refresh())}
      disabled={refreshing}
      aria-label="Refresh"
      title="Refresh"
      className={cn(CHIP_CLASSES, "w-11 justify-center px-0 sm:w-9")}
    >
      <RefreshCw
        aria-hidden="true"
        className={cn("size-4", refreshing && "animate-spin")}
      />
    </button>
  )
}
