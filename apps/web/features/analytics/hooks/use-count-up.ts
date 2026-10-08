"use client"

import { useEffect, useState } from "react"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

export const COUNT_UP_MS = 600

/** easeOutCubic: fast start, gentle landing. */
const ease = (progress: number) => 1 - (1 - progress) ** 3

/**
 * Counts from 0 up to `target` over 600 ms, once, when the number first
 * mounts; later changes show at once. The first render returns `target`, so
 * the server HTML always has the real number; with reduced motion it never
 * animates.
 */
export function useCountUp(target: number): number {
  const reducedMotion = usePrefersReducedMotion()
  const [progress, setProgress] = useState(1)

  useEffect(() => {
    if (reducedMotion) return
    let frame = 0
    const start = performance.now()
    const tick = () => {
      const next = Math.min((performance.now() - start) / COUNT_UP_MS, 1)
      setProgress(next)
      if (next < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reducedMotion])

  return reducedMotion ? target : target * ease(progress)
}
