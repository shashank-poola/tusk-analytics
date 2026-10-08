import { describe, expect, it } from "vitest"

import {
  mixRgb,
  parseHex,
  quoteFamilies,
} from "@/features/marketing/utils/wordmark-tiles"

describe("wordmark helpers", () => {
  it("quotes family names so canvas accepts names like Baloo 2", () => {
    expect(
      quoteFamilies(
        `'fontHeading', fontHeading Fallback, Baloo 2, system-ui, sans-serif`
      )
    ).toBe(
      `"fontHeading", "fontHeading Fallback", "Baloo 2", system-ui, sans-serif`
    )
  })

  it("reads token hex colours and mixes them", () => {
    expect(parseHex(" #2d8cff")).toEqual([45, 140, 255])
    expect(parseHex("oklch(0.5 0.1 200)")).toEqual([0, 0, 0])
    expect(mixRgb([0, 0, 0], [200, 100, 50], 0.5)).toEqual([100, 50, 25])
  })
})
