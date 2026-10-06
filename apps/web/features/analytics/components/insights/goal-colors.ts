/**
 * One colour per goal line and list bar, distinct in both themes (mid
 * lightness, varied hue), in the order goals are listed.
 */
export const GOAL_COLORS = [
  "oklch(0.7 0.15 150)",
  "oklch(0.66 0.17 25)",
  "oklch(0.66 0.14 285)",
  "oklch(0.75 0.14 75)",
  "oklch(0.68 0.12 200)",
  "oklch(0.66 0.16 340)",
  "oklch(0.72 0.14 120)",
  "oklch(0.7 0.13 50)",
  "oklch(0.64 0.13 250)",
  "oklch(0.72 0.1 170)",
] as const

export function goalColor(index: number): string {
  return GOAL_COLORS[index % GOAL_COLORS.length] ?? GOAL_COLORS[0]
}
