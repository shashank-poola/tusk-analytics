// @vitest-environment-options { "url": "http://localhost:4000/" }
import { afterEach, describe, expect, it } from "vitest"

import { loadTracker, mockBeacon, resetPage, SITE_ID } from "./helpers"

afterEach(resetPage)

describe("on localhost", () => {
  it("sends nothing by default", async () => {
    const beacon = mockBeacon()

    await loadTracker()

    expect(beacon).not.toHaveBeenCalled()
  })

  it("tracks with data-allow-localhost and sets the visitor cookie over http", async () => {
    const beacon = mockBeacon()

    await loadTracker({ "data-site": SITE_ID, "data-allow-localhost": "true" })

    expect(beacon).toHaveBeenCalledTimes(1)
    expect(document.cookie).toMatch(/vt_vid=/)
  })
})
