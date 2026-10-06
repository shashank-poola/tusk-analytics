"use client"

import { useEffect, useState } from "react"

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion"

export const COUNT_UP_MS = 300

/** easeOutCubic: fast start, gentle landing. */
const ease = (progress: number) => 1 - (1 - progress) ** 3

/**
 * Counts from 0 up to `target` over 300 ms each time `target` changes. The
 * first render returns `target`, so the server HTML always has the real
 * number; with reduced motion it never animates.
 */
export function useCountUp(target: number): number {
  const reducedMotion = usePrefersReducedMotion()
  const [value, setValue] = useState(target)

  useEffect(() => {
    if (reducedMotion) return
    let frame = 0
    const start = performance.now()
    const tick = () => {
      const progress = Math.min((performance.now() - start) / COUNT_UP_MS, 1)
      setValue(target * ease(progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, reducedMotion])

  return reducedMotion ? target : value
}
