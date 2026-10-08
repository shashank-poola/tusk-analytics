/**
 * One colour per goal line and list bar, in the order goals are listed:
 * the brand's chart series first (Tusk Blue, Sunrise, Pip Teal, Snap
 * Purple, Peck Coral), then mid-lightness hues that hold up in both themes.
 */
export const GOAL_COLORS = [
  "#2d8cff",
  "#ffb020",
  "#2ec4b6",
  "#8b5cf6",
  "#ff6b4a",
  "oklch(0.7 0.15 150)",
  "oklch(0.66 0.16 340)",
  "oklch(0.72 0.14 120)",
  "oklch(0.6 0.08 60)",
  "oklch(0.64 0.05 250)",
] as const

export function goalColor(index: number): string {
  return GOAL_COLORS[index % GOAL_COLORS.length] ?? GOAL_COLORS[0]
}
