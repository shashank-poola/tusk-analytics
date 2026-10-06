"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { isPlainKeyPress } from "@/lib/keyboard"

type PeriodShortcutsProps = {
  /** Lowercase key → the link it opens, e.g. `{ w: "/sites/…?range=7d" }`. */
  links: Record<string, string>
}

/** One-key jumps between periods (T, Y, H, W, M), shown in the period menu. */
export function PeriodShortcuts({ links }: PeriodShortcutsProps) {
  const router = useRouter()
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isPlainKeyPress(event)) return
      const href = links[event.key.toLowerCase()]
      if (!href) return
      event.preventDefault()
      router.push(href, { scroll: false })
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [links, router])
  return null
}
