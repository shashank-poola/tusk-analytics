import { describe, expect, it } from "vitest"

import { filterChips, rowFilters } from "@/features/analytics/utils/filters"

describe("row filters", () => {
  it("filters by a row's value", () => {
    expect(
      rowFilters("source", { key: "google", visitors: 1, pageviews: 1 })
    ).toEqual({ source: "google" })
  })

  it("adds the country to a city or region, so Paris, FR is not Paris, US", () => {
    expect(
      rowFilters("city", {
        key: "Paris",
        country: "FR",
        visitors: 1,
        pageviews: 1,
      })
    ).toEqual({ city: "Paris", country: "FR" })
  })

  it("can't filter by an unknown value", () => {
    expect(
      rowFilters("country", { key: null, visitors: 1, pageviews: 1 })
    ).toBeNull()
  })
})

describe("filter chips", () => {
  it("names each filter after its tab, with a readable value", () => {
    expect(filterChips({ source: "direct", country: "IN" })).toEqual([
      { key: "source", label: "Referrer", value: "Direct/None" },
      { key: "country", label: "Country", value: "India" },
    ])
  })
})
