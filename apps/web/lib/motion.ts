// One set of motion values for every animated thing on the landing page.

/** Fast out, soft landing. */
export const EASE = [0.22, 1, 0.36, 1] as const

export const DURATION = { fast: 0.15, base: 0.3, slow: 0.6 } as const

export const SPRING = { type: "spring", stiffness: 300, damping: 22 } as const
