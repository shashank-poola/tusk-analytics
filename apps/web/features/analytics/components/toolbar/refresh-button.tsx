"use client"

import { cn } from "@workspace/ui/lib/utils"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { CHIP_CLASSES } from "./chip"

/** Refetches every section without leaving the page or losing scroll. */
export function RefreshButton() {
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
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
