import { describe, expect, it } from "vitest"

import {
  CUSTOM_TIER,
  eventsLabel,
  formatDollars,
  PLANS,
  planPrice,
} from "@/features/marketing/utils/pricing"

const [starter, growth] = PLANS
if (!starter || !growth) throw new Error("Expected two plans")

describe("pricing", () => {
  it("starts Starter at $5 and Growth at $9 a month for 10k events", () => {
    expect(planPrice(starter, 0, "monthly")).toEqual({
      kind: "monthly",
      perMonth: 5,
    })
    expect(planPrice(growth, 0, "monthly")).toEqual({
      kind: "monthly",
      perMonth: 9,
    })
  })

  it("charges ten months for a year: two months free", () => {
    expect(planPrice(starter, 0, "yearly")).toEqual({
      kind: "yearly",
      perYear: 50,
      perMonth: 50 / 12,
    })
  })

  it("has a price for every tier on both plans, and goes custom past 10M", () => {
    for (const plan of PLANS) {
      for (let tier = 0; tier < CUSTOM_TIER; tier++) {
        expect(planPrice(plan, tier, "monthly").kind).toBe("monthly")
      }
      expect(planPrice(plan, CUSTOM_TIER, "monthly")).toEqual({
        kind: "custom",
      })
    }
  })

  it("never charges less for more events", () => {
    for (const plan of PLANS) {
      const sorted = [...plan.monthly].sort((a, b) => a - b)
      expect(plan.monthly).toEqual(sorted)
    }
  })

  it("labels tiers the way people say them", () => {
    expect(eventsLabel(0)).toBe("10k")
    expect(eventsLabel(4)).toBe("1M")
    expect(eventsLabel(CUSTOM_TIER)).toBe("10M+")
  })

  it("shows whole dollars plainly and cents only when there are some", () => {
    expect(formatDollars(5)).toBe("$5")
    expect(formatDollars(50 / 12)).toBe("$4.17")
  })
})
