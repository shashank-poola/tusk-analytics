import { describe, expect, it } from "vitest"

import { peakIndexes } from "@/features/analytics/utils/chart-peaks"

const always = () => true

describe("peakIndexes", () => {
  it("picks the biggest local maxima, in chart order", () => {
    expect(peakIndexes([1, 5, 2, 9, 3, 4, 1], always)).toEqual([1, 3])
  })

  it("skips peaks without a source to show and empty buckets", () => {
    expect(peakIndexes([0, 9, 1, 5, 1], (index) => index !== 1)).toEqual([3])
    expect(peakIndexes([0, 0, 0], always)).toEqual([])
  })

  it("keeps peaks apart on long charts so icons don't overlap", () => {
    // Peaks at 10 and 12 are 2 points apart; 30 points need 3.
    const values = Array.from({ length: 30 }, () => 1)
    values[10] = 50
    values[11] = 0
    values[12] = 45
    values[20] = 30
    const peaks = peakIndexes(values, always)

    expect(peaks).toContain(10)
    expect(peaks).not.toContain(12)
    expect(peaks).toContain(20)
  })
})
