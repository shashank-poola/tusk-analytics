import { beforeEach, describe, expect, it, vi } from "vitest"

import { setViewAction } from "@/features/analytics/server/view-actions"

const { set } = vi.hoisted(() => ({ set: vi.fn() }))
vi.mock("next/headers", () => ({ cookies: async () => ({ set }) }))

const SITE_ID = "vt_3k9x2m7qpd4n8r1t"

beforeEach(() => set.mockClear())

describe("setViewAction", () => {
  it("keeps the view in this site's cookie, in its canonical short form", async () => {
    await setViewAction(SITE_ID, {
      range: "7d",
      country: "IN",
      sources: "referrer",
      junk: "x",
    })

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "vt_view",
        // The default tab and unknown params are dropped.
        value: "range=7d&country=IN",
        path: `/site/${SITE_ID}`,
        httpOnly: true,
        sameSite: "lax",
      })
    )
  })

  it("stores nothing for an id that isn't a site id", async () => {
    await setViewAction("../../x", { range: "30d" })

    expect(set).not.toHaveBeenCalled()
  })

  it("stores nothing for a view too long for a cookie", async () => {
    await setViewAction(SITE_ID, {
      page: "x".repeat(1024),
      entry_page: "x".repeat(1024),
      city: "x".repeat(1024),
      region: "x".repeat(1024),
    })

    expect(set).not.toHaveBeenCalled()
  })
})
