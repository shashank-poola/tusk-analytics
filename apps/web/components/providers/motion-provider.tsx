"use client"

import { LazyMotion, MotionConfig } from "motion/react"

const loadFeatures = () =>
  import("@/lib/motion-features").then((module) => module.default)

/**
 * `m` components with the DOM animation features loaded lazily. With
 * `reducedMotion="user"`, people who ask for less motion get none: values
 * jump straight to their end state.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
