"use client"

import { type RefObject, useEffect } from "react"

/**
 * Closes an open <details> menu on a click outside it or on Escape, and
 * returns focus to its <summary> after Escape.
 */
export function useDismiss(ref: RefObject<HTMLDetailsElement | null>) {
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const details = ref.current
      if (!details?.open) return
      if (event.target instanceof Node && details.contains(event.target)) return
      details.open = false
    }
    function onKeyDown(event: KeyboardEvent) {
      const details = ref.current
      if (event.key !== "Escape" || !details?.open) return
      details.open = false
      details.querySelector("summary")?.focus()
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [ref])
}
