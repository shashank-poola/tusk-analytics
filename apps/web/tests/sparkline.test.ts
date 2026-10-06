import { describe, expect, it } from "vitest"

import { sparklinePath } from "@/features/analytics/sparkline-path"

const BOX = { width: 100, height: 20, padding: 0 }

describe("sparklinePath", () => {
  it("is empty without values", () => {
    expect(sparklinePath([], BOX)).toBe("")
  })

  it("draws one value as a flat line through the middle", () => {
    expect(sparklinePath([7], BOX)).toBe("M0 10H100")
  })

  it("draws a flat series through the middle, not along the bottom", () => {
    expect(sparklinePath([3, 3, 3], BOX)).toBe("M0 10L50 10L100 10")
  })

  it("scales the lowest value to the bottom and the highest to the top", () => {
    expect(sparklinePath([0, 10, 5], BOX)).toBe("M0 20L50 0L100 10")
  })

  it("keeps the line inside the padding", () => {
    expect(sparklinePath([0, 10], { ...BOX, padding: 2 })).toBe("M2 18L98 2")
  })
})
