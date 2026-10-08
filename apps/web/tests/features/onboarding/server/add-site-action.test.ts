import { describe, expect, it, vi } from "vitest"

import { addSite } from "@/features/onboarding/server/add-site-action"

const { createSite, deleteCookie } = vi.hoisted(() => ({
  createSite: vi.fn(),
  deleteCookie: vi.fn(),
}))

vi.mock("@/features/sites/server/sites.queries", () => ({ createSite }))
vi.mock("next/headers", () => ({
  cookies: async () => ({ delete: deleteCookie }),
}))

const REQUEST = { domain: "https://www.example.com/", timezone: "UTC" }
const SITE = { id: "vt_3k9x2m7qpd4n8r1t", domain: "example.com" }

function apiError(code: string, message: string) {
  return { ok: false, status: 400, error: { code, message } }
}

describe("addSite", () => {
  it("sends the normalized site and returns it for the install step", async () => {
    createSite.mockResolvedValue({ ok: true, data: SITE })

    expect(await addSite(REQUEST)).toEqual({ ok: true, site: SITE })
    expect(createSite).toHaveBeenCalledWith({
      domain: "example.com",
      timezone: "UTC",
      name: "example.com",
    })
  })

  it("forgets the domain typed on the landing page once the site exists", async () => {
    createSite.mockResolvedValue({ ok: true, data: SITE })

    await addSite(REQUEST)

    expect(deleteCookie).toHaveBeenCalledWith("tusk_signup_domain")
  })

  it("puts a duplicate-domain error on the domain field", async () => {
    createSite.mockResolvedValue(
      apiError("site_already_exists", "You already added example.com.")
    )

    expect(await addSite(REQUEST)).toEqual({
      ok: false,
      errors: { domain: "You already added example.com." },
    })
  })

  it("shows the site limit above the button", async () => {
    createSite.mockResolvedValue(
      apiError("site_limit_reached", "You can add up to 25 sites per account.")
    )

    expect(await addSite(REQUEST)).toEqual({
      ok: false,
      errors: { form: "You can add up to 25 sites per account." },
    })
  })

  it("shows other API errors above the button", async () => {
    createSite.mockResolvedValue(
      apiError("bad_request", "localhost only works in development.")
    )

    expect(await addSite(REQUEST)).toEqual({
      ok: false,
      errors: { form: "localhost only works in development." },
    })
  })

  it("rejects invalid input without calling the API", async () => {
    createSite.mockClear()

    expect(await addSite({ domain: "not a domain", timezone: "UTC" })).toEqual({
      ok: false,
      errors: { form: "Check the domain and time zone, then try again." },
    })
    expect(createSite).not.toHaveBeenCalled()
  })
})
