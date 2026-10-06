import {
  installStatusSchema,
  siteListResponseSchema,
  siteResponseSchema,
  siteSchema,
} from "@workspace/contracts"
import { createDb, eq, events, sites } from "@workspace/db"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import * as sitesService from "../src/api/v1/sites/sites.service"
import { app } from "../src/app"
import { AppError } from "../src/lib/errors"
import { createSite, signIn, uniqueDomain } from "./helpers"

function api(
  path: string,
  {
    cookie,
    environment = env,
  }: { cookie?: string; environment?: typeof env } = {},
  init: RequestInit = {}
) {
  return app.request(
    `/api/v1${path}`,
    {
      ...init,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        "Content-Type": "application/json",
      },
    },
    environment
  )
}

function post(path: string, cookie: string, body: unknown, environment = env) {
  return api(
    path,
    { cookie, environment },
    { method: "POST", body: JSON.stringify(body) }
  )
}

/** Sites created in the same millisecond have no defined order. */
async function backdate(siteId: string) {
  await createDb(env.DB)
    .update(sites)
    .set({ createdAt: new Date(Date.now() - 60_000) })
    .where(eq(sites.id, siteId))
}

const SITE_NOT_FOUND = {
  error: { code: "not_found", message: "Site not found" },
}
const SIGNED_OUT = {
  error: { code: "unauthorized", message: "Sign in to continue" },
}

describe("sites service", () => {
  const db = createDb(env.DB)

  it("creates a site named after its domain", async () => {
    const { userId } = await signIn()
    const domain = uniqueDomain()

    const site = await sitesService.createSite(db, {
      ownerId: userId,
      input: { domain, timezone: "Europe/Berlin", name: domain },
      allowLocalhost: false,
    })

    // siteSchema also checks that createId's ids still match siteIdSchema.
    expect(siteSchema.parse(site)).toEqual({
      id: site.id,
      name: domain,
      domain,
      timezone: "Europe/Berlin",
      createdAt: site.createdAt,
    })
  })

  it("refuses a second site with the same domain for the same owner", async () => {
    const { userId } = await signIn()
    const input = { domain: uniqueDomain(), timezone: "UTC", name: "Blog" }
    await sitesService.createSite(db, {
      ownerId: userId,
      input,
      allowLocalhost: false,
    })

    const second = sitesService.createSite(db, {
      ownerId: userId,
      input,
      allowLocalhost: false,
    })

    await expect(second).rejects.toBeInstanceOf(AppError)
    await expect(second).rejects.toMatchObject({ code: "site_already_exists" })
  })

  it("lets two owners track the same domain", async () => {
    const input = { domain: uniqueDomain(), timezone: "UTC", name: "Blog" }
    const owners = [(await signIn()).userId, (await signIn()).userId]

    const created = await Promise.all(
      owners.map((ownerId) =>
        sitesService.createSite(db, { ownerId, input, allowLocalhost: false })
      )
    )

    expect(created.map((site) => site.domain)).toEqual([
      input.domain,
      input.domain,
    ])
  })

  it("rejects localhost unless the environment allows it", async () => {
    const { userId } = await signIn()
    const input = { domain: "localhost", timezone: "UTC", name: "Local" }

    const inProduction = sitesService.createSite(db, {
      ownerId: userId,
      input,
      allowLocalhost: false,
    })
    await expect(inProduction).rejects.toMatchObject({ code: "bad_request" })

    const inDevelopment = await sitesService.createSite(db, {
      ownerId: userId,
      input,
      allowLocalhost: true,
    })
    expect(inDevelopment.domain).toBe("localhost")
  })

  it("lists only the owner's sites, newest first", async () => {
    const { userId } = await signIn()
    await createSite((await signIn()).userId)
    const older = await createSite(userId)
    await backdate(older.id)
    const newer = await createSite(userId)

    const listed = await sitesService.listSites(db, {
      ownerId: userId,
      limit: 10,
    })

    expect(listed.map((site) => site.id)).toEqual([newer.id, older.id])
  })
})

describe("POST /api/v1/sites", () => {
  it("creates a site from a pasted URL and answers 201", async () => {
    const owner = await signIn()
    const domain = uniqueDomain()

    const res = await post("/sites", owner.cookie, {
      domain: `https://www.${domain.toUpperCase()}/pricing?ref=x`,
      timezone: "Asia/Kolkata",
    })

    expect(res.status).toBe(201)
    const { site } = siteResponseSchema.parse(await res.json())
    expect(site).toMatchObject({
      domain,
      name: domain,
      timezone: "Asia/Kolkata",
    })
  })

  it("answers 409 site_already_exists for a domain the owner already has", async () => {
    const owner = await signIn()
    const domain = uniqueDomain()
    await post("/sites", owner.cookie, { domain, timezone: "UTC" })

    const res = await post("/sites", owner.cookie, {
      domain: `www.${domain}`,
      timezone: "UTC",
    })

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      error: {
        code: "site_already_exists",
        message: `You already added ${domain}. Pick it from your dashboard instead.`,
      },
    })
  })

  it("answers 400 naming the field for an invalid domain", async () => {
    const owner = await signIn()

    const res = await post("/sites", owner.cookie, {
      domain: "192.168.0.1",
      timezone: "UTC",
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: {
        code: "bad_request",
        message: "domain: Use your site's domain, not an IP address",
      },
    })
  })

  it("answers 400 for an unknown time zone", async () => {
    const owner = await signIn()

    const res = await post("/sites", owner.cookie, {
      domain: uniqueDomain(),
      timezone: "Mars/Olympus_Mons",
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: {
        code: "bad_request",
        message: "timezone: Choose a time zone like Europe/Berlin",
      },
    })
  })

  it("answers 413 for an oversized body", async () => {
    const owner = await signIn()

    const res = await post("/sites", owner.cookie, {
      domain: uniqueDomain(),
      timezone: "UTC",
      name: "x".repeat(5000),
    })

    expect(res.status).toBe(413)
    expect(await res.json()).toEqual({
      error: {
        code: "bad_request",
        message: "Request body is larger than 4096 bytes",
      },
    })
  })

  it("rejects localhost in production", async () => {
    const owner = await signIn()

    const res = await post("/sites", owner.cookie, {
      domain: "localhost:3000",
      timezone: "UTC",
    })

    expect(env.ENVIRONMENT).toBe("production")
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: {
        code: "bad_request",
        message:
          "localhost only works in development. Enter your site's public domain, like myapp.com.",
      },
    })
  })

  it("accepts localhost in development", async () => {
    const owner = await signIn()

    const res = await post(
      "/sites",
      owner.cookie,
      { domain: "http://localhost:3000", timezone: "UTC" },
      { ...env, ENVIRONMENT: "development" }
    )

    expect(res.status).toBe(201)
    const { site } = siteResponseSchema.parse(await res.json())
    expect(site.domain).toBe("localhost")
  })

  it("answers 401 when signed out", async () => {
    const res = await api(
      "/sites",
      {},
      {
        method: "POST",
        body: JSON.stringify({ domain: uniqueDomain(), timezone: "UTC" }),
      }
    )

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual(SIGNED_OUT)
  })
})

describe("GET /api/v1/sites", () => {
  it("lists only the caller's sites", async () => {
    const userA = await signIn()
    await createSite((await signIn()).userId)
    const mine = await createSite(userA.userId)

    const res = await api("/sites", { cookie: userA.cookie })

    expect(res.status).toBe(200)
    const body = siteListResponseSchema.parse(await res.json())
    expect(body.sites.map((site) => site.id)).toEqual([mine.id])
  })

  it("returns at most `limit` sites, newest first", async () => {
    const owner = await signIn()
    await backdate((await createSite(owner.userId)).id)
    const newest = await createSite(owner.userId)

    const res = await api("/sites?limit=1", { cookie: owner.cookie })

    const body = siteListResponseSchema.parse(await res.json())
    expect(body.sites.map((site) => site.id)).toEqual([newest.id])
  })

  it("answers 400 for a limit above the maximum", async () => {
    const owner = await signIn()

    const res = await api("/sites?limit=101", { cookie: owner.cookie })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: { code: "bad_request" } })
  })

  it("answers 401 when signed out", async () => {
    const res = await api("/sites")

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual(SIGNED_OUT)
  })
})

describe("GET /api/v1/sites/:siteId", () => {
  it("returns the owner's site", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)

    const res = await api(`/sites/${site.id}`, { cookie: owner.cookie })

    expect(res.status).toBe(200)
    expect(siteResponseSchema.parse(await res.json())).toEqual({
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain,
        timezone: site.timezone,
        createdAt: site.createdAt.toISOString(),
      },
    })
  })

  it("answers 404 when user B asks for user A's site", async () => {
    const userA = await signIn()
    const userB = await signIn()
    const siteOfA = await createSite(userA.userId)

    const res = await api(`/sites/${siteOfA.id}`, { cookie: userB.cookie })

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(SITE_NOT_FOUND)
  })

  it("answers 401 when signed out", async () => {
    const site = await createSite((await signIn()).userId)

    const res = await api(`/sites/${site.id}`)

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual(SIGNED_OUT)
  })
})

describe("site limit", () => {
  it(`answers 409 site_limit_reached once the owner has ${sitesService.MAX_SITES_PER_USER} sites`, async () => {
    const owner = await signIn()
    await Promise.all(
      Array.from({ length: sitesService.MAX_SITES_PER_USER }, () =>
        createSite(owner.userId)
      )
    )

    const res = await post("/sites", owner.cookie, {
      domain: uniqueDomain(),
      timezone: "UTC",
    })

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      error: {
        code: "site_limit_reached",
        message:
          "You can add up to 25 sites per account. Contact us if you need more.",
      },
    })
  })

  it("still lets the owner add a site below the limit", async () => {
    const owner = await signIn()
    await Promise.all(
      Array.from({ length: sitesService.MAX_SITES_PER_USER - 1 }, () =>
        createSite(owner.userId)
      )
    )

    const res = await post("/sites", owner.cookie, {
      domain: uniqueDomain(),
      timezone: "UTC",
    })

    expect(res.status).toBe(201)
  })
})

describe("GET /api/v1/sites/:siteId/install-status", () => {
  it("says not connected before the first event and connected after", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)

    const before = await api(`/sites/${site.id}/install-status`, {
      cookie: owner.cookie,
    })
    expect(before.status).toBe(200)
    expect(installStatusSchema.parse(await before.json())).toEqual({
      connected: false,
      firstEventAt: null,
    })

    const firstEventAt = new Date("2026-10-01T12:00:00.000Z")
    await createDb(env.DB)
      .insert(events)
      .values([
        {
          siteId: site.id,
          visitorId: crypto.randomUUID(),
          sessionId: crypto.randomUUID(),
          path: "/",
          createdAt: new Date("2026-10-02T12:00:00.000Z"),
        },
        {
          siteId: site.id,
          visitorId: crypto.randomUUID(),
          sessionId: crypto.randomUUID(),
          path: "/",
          createdAt: firstEventAt,
        },
      ])

    const after = await api(`/sites/${site.id}/install-status`, {
      cookie: owner.cookie,
    })
    expect(installStatusSchema.parse(await after.json())).toEqual({
      connected: true,
      firstEventAt: firstEventAt.toISOString(),
    })
  })

  it("answers 404 when user B asks for user A's site", async () => {
    const userA = await signIn()
    const userB = await signIn()
    const siteOfA = await createSite(userA.userId)

    const res = await api(`/sites/${siteOfA.id}/install-status`, {
      cookie: userB.cookie,
    })

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(SITE_NOT_FOUND)
  })

  it("answers 401 when signed out", async () => {
    const site = await createSite((await signIn()).userId)

    const res = await api(`/sites/${site.id}/install-status`)

    expect(res.status).toBe(401)
  })
})

describe("CORS", () => {
  it("adds no CORS headers to /api/v1/sites, even for a cross-origin request", async () => {
    const owner = await signIn()
    const crossOrigin = { Origin: "https://evil.example" }

    const list = await app.request(
      "/api/v1/sites",
      { headers: { Cookie: owner.cookie, ...crossOrigin } },
      env
    )
    const preflight = await app.request(
      "/api/v1/sites",
      {
        method: "OPTIONS",
        headers: { ...crossOrigin, "Access-Control-Request-Method": "POST" },
      },
      env
    )

    for (const res of [list, preflight]) {
      const corsHeaders = [...res.headers.keys()].filter((name) =>
        name.startsWith("access-control-")
      )
      expect(corsHeaders).toEqual([])
    }
  })
})
