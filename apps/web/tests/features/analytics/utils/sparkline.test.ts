import { describe, expect, it } from "vitest"

import { sparklinePath } from "@/features/analytics/utils/sparkline"

/** Every y coordinate in the path. */
function ys(path: string): number[] {
  return [...path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((match) =>
    Number(match[2])
  )
}

describe("sparklinePath", () => {
  it("draws a smooth curve from left to right across the width", () => {
    const path = sparklinePath([0, 2, 1, 4], 300, 64)

    expect(path.startsWith("M0,62")).toBe(true)
    expect(path.endsWith("300,2")).toBe(true)
    expect(path.match(/C/g)).toHaveLength(3)
  })

  it("never dips below the baseline or above the top", () => {
    for (const y of ys(sparklinePath([0, 0, 0, 5, 0, 0, 3, 0], 300, 64))) {
      expect(y).toBeGreaterThanOrEqual(2)
      expect(y).toBeLessThanOrEqual(62)
    }
  })

  it("keeps an all-zero period flat on the baseline", () => {
    expect(new Set(ys(sparklinePath([0, 0, 0], 300, 64)))).toEqual(
      new Set([62])
    )
  })
})
