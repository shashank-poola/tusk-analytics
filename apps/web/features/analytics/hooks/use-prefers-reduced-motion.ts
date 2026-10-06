"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

/** True when the user asked for less motion. The server assumes they did. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true
  )
}
