import { afterEach, describe, expect, it } from "vitest"

import {
  loadTracker,
  mockBeacon,
  resetPage,
  sentPayloads,
  SITE_ID,
} from "./helpers"

const COOKIELESS = { "data-site": SITE_ID, "data-cookieless": "true" }

afterEach(resetPage)

describe("cookieless mode", () => {
  it("sets no cookies", async () => {
    mockBeacon()

    await loadTracker(COOKIELESS)

    expect(document.cookie).not.toContain("vt_vid")
    expect(document.cookie).not.toContain("vt_sid")
  })

  it("ignores ids left in cookies from before", async () => {
    document.cookie = "vt_vid=11111111-1111-4111-8111-111111111111; Path=/"
    const beacon = mockBeacon()

    await loadTracker(COOKIELESS)

    const [pageview] = await sentPayloads(beacon)
    expect(pageview?.visitorId).not.toBe("11111111-1111-4111-8111-111111111111")
  })

  it("keeps one visitor and session across SPA pageviews on the same page", async () => {
    const beacon = mockBeacon()
    await loadTracker(COOKIELESS)

    history.pushState(null, "", "/pricing")

    const [first, second] = await sentPayloads(beacon)
    expect(second?.visitorId).toBe(first?.visitorId)
    expect(second?.sessionId).toBe(first?.sessionId)
    expect(second?.newSession).toBe(false)
  })
})

describe("cookieless mode storage", () => {
  it("writes nothing to localStorage or sessionStorage", async () => {
    mockBeacon()
    const before = [localStorage.length, sessionStorage.length]

    await loadTracker(COOKIELESS)
    history.pushState(null, "", "/pricing")

    expect([localStorage.length, sessionStorage.length]).toEqual(before)
  })

  it("still honours the owner's vt_ignore opt-out", async () => {
    localStorage.setItem("vt_ignore", "1")
    const beacon = mockBeacon()

    await loadTracker(COOKIELESS)

    expect(beacon).not.toHaveBeenCalled()
    localStorage.removeItem("vt_ignore")
  })
})
