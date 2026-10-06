import { describe, expect, it, vi } from "vitest"

import { addSite } from "@/features/onboarding/server/add-site-action"

const { createSite, redirect } = vi.hoisted(() => ({
  createSite: vi.fn(),
  // Like the real one, redirect() throws to stop the action.
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`)
  }),
}))

vi.mock("@/features/sites/server/sites.queries", () => ({ createSite }))
vi.mock("next/navigation", () => ({ redirect }))

const REQUEST = { domain: "https://www.example.com/", timezone: "UTC" }

function apiError(code: string, message: string) {
  return { ok: false, status: 400, error: { code, message } }
}

describe("addSite", () => {
  it("sends the normalized site and redirects to its install snippet", async () => {
    createSite.mockResolvedValue({
      ok: true,
      data: { id: "vt_3k9x2m7qpd4n8r1t" },
    })

    await expect(addSite(REQUEST)).rejects.toThrow(
      "redirect:/onboarding/vt_3k9x2m7qpd4n8r1t"
    )
    expect(createSite).toHaveBeenCalledWith({
      domain: "example.com",
      timezone: "UTC",
      name: "example.com",
    })
  })

  it("puts a duplicate-domain error on the domain field", async () => {
    createSite.mockResolvedValue(
      apiError("site_already_exists", "You already added example.com.")
    )

    expect(await addSite(REQUEST)).toEqual({
      domain: "You already added example.com.",
    })
  })

  it("shows the site limit above the button", async () => {
    createSite.mockResolvedValue(
      apiError("site_limit_reached", "You can add up to 25 sites per account.")
    )

    expect(await addSite(REQUEST)).toEqual({
      form: "You can add up to 25 sites per account.",
    })
  })

  it("shows other API errors above the button", async () => {
    createSite.mockResolvedValue(
      apiError("bad_request", "localhost only works in development.")
    )

    expect(await addSite(REQUEST)).toEqual({
      form: "localhost only works in development.",
    })
  })

  it("rejects invalid input without calling the API", async () => {
    expect(await addSite({ domain: "not a domain", timezone: "UTC" })).toEqual({
      form: "Check the domain and time zone, then try again.",
    })
    expect(createSite).not.toHaveBeenCalled()
  })
})
