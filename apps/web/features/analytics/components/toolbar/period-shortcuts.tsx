"use client"

import { useEffect } from "react"

import { useSetView } from "@/features/analytics/hooks/use-set-view"
import { isPlainKeyPress } from "@/lib/keyboard"

type PeriodShortcutsProps = {
  /** Lowercase key → the link it opens, e.g. `{ w: "/sites/…?range=7d" }`. */
  links: Record<string, string>
}

/** One-key jumps between periods (T, Y, H, W, M), shown in the period menu. */
export function PeriodShortcuts({ links }: PeriodShortcutsProps) {
  const { setView } = useSetView()
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isPlainKeyPress(event)) return
      const href = links[event.key.toLowerCase()]
      if (!href) return
      event.preventDefault()
      setView(href)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [links, setView])
  return null
}
