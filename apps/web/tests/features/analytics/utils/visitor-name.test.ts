import { describe, expect, it } from "vitest"

import { visitorName } from "@/features/analytics/utils/visitor-name"

describe("visitorName", () => {
  it("gives the same nickname for the same visitor id", () => {
    expect(visitorName("abc-123")).toBe(visitorName("abc-123"))
  })

  it("can give different nicknames to different ids", () => {
    const names = new Set(
      Array.from({ length: 50 }, (_, index) => visitorName(`visitor-${index}`))
    )

    expect(names.size).toBeGreaterThan(10)
  })

  it("is always an adjective and an animal", () => {
    for (const id of ["", "a", "visitor-1", "café ✓", "x".repeat(500)]) {
      expect(visitorName(id)).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    }
  })
})
