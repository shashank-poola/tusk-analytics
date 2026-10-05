import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import { createSite, middlewareApp, signIn } from "./helpers"

function getSite(siteId: string, cookie?: string) {
  return middlewareApp.request(
    `/sites/${siteId}`,
    { headers: cookie ? { Cookie: cookie } : {} },
    env
  )
}

const NOT_FOUND = { error: { code: "not_found", message: "Site not found" } }

describe("requireSite", () => {
  it("lets the owner through", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)

    const res = await getSite(site.id, owner.cookie)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ siteId: site.id })
  })

  it("returns 404, not 403, when user A asks for user B's site", async () => {
    const userA = await signIn()
    const userB = await signIn()
    const siteOfB = await createSite(userB.userId)

    const res = await getSite(siteOfB.id, userA.cookie)

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(NOT_FOUND)
  })

  it("answers someone else's site exactly like a site that doesn't exist", async () => {
    const userA = await signIn()
    const siteOfB = await createSite((await signIn()).userId)

    const othersSite = await getSite(siteOfB.id, userA.cookie)
    const missingSite = await getSite("vt_doesnotexist0000", userA.cookie)

    expect(missingSite.status).toBe(othersSite.status)
    expect(await missingSite.json()).toEqual(await othersSite.json())
  })

  it("returns 401 before looking up the site when signed out", async () => {
    const site = await createSite((await signIn()).userId)

    const res = await getSite(site.id)

    expect(res.status).toBe(401)
  })
})
