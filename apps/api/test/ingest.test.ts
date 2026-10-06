import type { CollectPayload } from "@workspace/contracts"
import {
  and,
  createDb,
  createId,
  eq,
  events,
  sites,
  visitors,
} from "@workspace/db"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import { ingestEvent } from "../src/api/v1/ingest/ingest.service"
import { app } from "../src/app"
import { createSite, signIn, uniqueDomain } from "./helpers"

const CHROME_ON_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"

const db = createDb(env.DB)

async function siteForNewUser() {
  return createSite((await signIn()).userId)
}

function pageview(
  siteId: string,
  overrides: Partial<CollectPayload> = {}
): CollectPayload {
  return {
    siteId,
    name: "pageview",
    url: "https://example.com/pricing",
    referrer: "",
    visitorId: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
    newSession: true,
    ...overrides,
  }
}

function collect(
  body: unknown,
  headers: Record<string, string | undefined> = {}
) {
  const sent = Object.fromEntries(
    Object.entries({
      "Content-Type": "text/plain;charset=UTF-8",
      "User-Agent": CHROME_ON_MAC,
      ...headers,
    }).filter((entry): entry is [string, string] => entry[1] !== undefined)
  )
  return app.request(
    "/api/v1/collect",
    {
      method: "POST",
      headers: sent,
      body: typeof body === "string" ? body : JSON.stringify(body),
    },
    env
  )
}

function visitorRows(siteId: string) {
  return db.select().from(visitors).where(eq(visitors.siteId, siteId))
}

function eventRows(siteId: string) {
  return db.select().from(events).where(eq(events.siteId, siteId))
}

describe("POST /api/v1/collect", () => {
  it("writes one visitor and one event, with fields derived on the server", async () => {
    const site = await siteForNewUser()
    const payload = pageview(site.id, {
      url: `https://${site.domain}/pricing?plan=pro#faq`,
      referrer: "https://news.ycombinator.com/item?id=1",
    })

    const res = await collect(payload, { Origin: `https://${site.domain}` })

    expect(res.status).toBe(202)
    expect(await res.text()).toBe("")
    const [visitor, ...otherVisitors] = await visitorRows(site.id)
    expect(otherVisitors).toEqual([])
    expect(visitor).toMatchObject({
      visitorId: payload.visitorId,
      firstSource: "hackernews",
      firstReferrer: "news.ycombinator.com",
      firstLandingPath: "/pricing",
      firstUtmSource: null,
    })
    const [event, ...otherEvents] = await eventRows(site.id)
    expect(otherEvents).toEqual([])
    expect(event).toMatchObject({
      visitorId: payload.visitorId,
      sessionId: payload.sessionId,
      name: "pageview",
      path: "/pricing",
      referrer: "news.ycombinator.com",
      source: "hackernews",
      browser: "Chrome",
      os: "macOS",
      device: "desktop",
    })
  })

  it("keeps the first-touch fields when the same visitor comes back", async () => {
    const site = await siteForNewUser()
    const origin = { Origin: `https://${site.domain}` }
    const first = pageview(site.id, {
      url: `https://${site.domain}/?utm_source=newsletter&utm_campaign=launch`,
    })
    await collect(first, origin)
    const [before] = await visitorRows(site.id)

    const res = await collect(
      pageview(site.id, {
        visitorId: first.visitorId,
        url: `https://${site.domain}/blog`,
        referrer: "https://www.google.com/",
      }),
      origin
    )

    expect(res.status).toBe(202)
    const [after] = await visitorRows(site.id)
    expect(after).toMatchObject({
      firstSource: "newsletter",
      firstUtmSource: "newsletter",
      firstUtmCampaign: "launch",
      firstReferrer: null,
      firstLandingPath: "/",
      firstSeenAt: before?.firstSeenAt,
    })
    expect(await eventRows(site.id)).toHaveLength(2)
  })

  it("moves last-seen only when the event starts a new session", async () => {
    const site = await siteForNewUser()
    const origin = { Origin: `https://${site.domain}` }
    const first = pageview(site.id)
    await collect(first, origin)
    const longAgo = new Date(Date.now() - 86_400_000)
    const visitorKey = and(
      eq(visitors.siteId, site.id),
      eq(visitors.visitorId, first.visitorId)
    )
    await db.update(visitors).set({ lastSeenAt: longAgo }).where(visitorKey)

    await collect({ ...first, newSession: false }, origin)
    const [sameSession] = await visitorRows(site.id)
    await collect(
      { ...first, sessionId: crypto.randomUUID(), newSession: true },
      origin
    )
    const [newSession] = await visitorRows(site.id)

    expect(sameSession?.lastSeenAt).toEqual(longAgo)
    expect(newSession?.lastSeenAt.getTime()).toBeGreaterThan(longAgo.getTime())
  })

  it("accepts events from www.<domain>", async () => {
    const site = await siteForNewUser()

    await collect(pageview(site.id), { Origin: `https://www.${site.domain}` })

    expect(await eventRows(site.id)).toHaveLength(1)
  })

  it("lets utm_source win over the referrer", async () => {
    const site = await siteForNewUser()

    await collect(
      pageview(site.id, {
        url: `https://${site.domain}/?utm_source=ProductHunt`,
        referrer: "https://www.google.com/",
      }),
      { Origin: `https://${site.domain}` }
    )

    const [event] = await eventRows(site.id)
    expect(event).toMatchObject({
      source: "producthunt",
      utmSource: "ProductHunt",
      referrer: "www.google.com",
    })
  })

  it("counts a referral from the site itself as direct", async () => {
    const site = await siteForNewUser()

    await collect(
      pageview(site.id, { referrer: `https://www.${site.domain}/blog` }),
      { Origin: `https://${site.domain}` }
    )

    const [event] = await eventRows(site.id)
    expect(event).toMatchObject({ source: "direct", referrer: null })
  })

  it("stores attacker-controlled UTM values as capped plain text", async () => {
    const site = await siteForNewUser()
    const campaign = encodeURIComponent(`<script>${"x".repeat(500)}`)

    await collect(
      pageview(site.id, {
        url: `https://${site.domain}/?utm_campaign=${campaign}`,
      }),
      { Origin: `https://${site.domain}` }
    )

    const [event] = await eventRows(site.id)
    expect(event?.utmCampaign).toBe(`<script>${"x".repeat(248)}`)
  })

  const DROPPED_ORIGINS: [string, (domain: string) => string | undefined][] = [
    ["another domain", () => "https://evil.example"],
    ["a lookalike domain", (domain) => `https://evil${domain}`],
    ["a subdomain other than www", (domain) => `https://app.${domain}`],
    ["no Origin header", () => undefined],
    ["Origin: null", () => "null"],
  ]

  it.each(DROPPED_ORIGINS)("drops events from %s", async (_, originFor) => {
    const site = await siteForNewUser()

    const res = await collect(pageview(site.id), {
      Origin: originFor(site.domain),
    })

    expect(res.status).toBe(202)
    expect(await eventRows(site.id)).toEqual([])
    expect(await visitorRows(site.id)).toEqual([])
  })

  it("drops events for a site that doesn't exist", async () => {
    const res = await collect(pageview("vt_doesnotexist0000"), {
      Origin: "https://example.com",
    })

    expect(res.status).toBe(202)
    expect(await eventRows("vt_doesnotexist0000")).toEqual([])
  })

  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36",
    "curl/8.7.1",
    "",
  ])("drops events from the bot user agent %j", async (userAgent) => {
    const site = await siteForNewUser()

    const res = await collect(pageview(site.id), {
      Origin: `https://${site.domain}`,
      "User-Agent": userAgent,
    })

    expect(res.status).toBe(202)
    expect(await eventRows(site.id)).toEqual([])
    expect(await visitorRows(site.id)).toEqual([])
  })

  it("answers 400 for a body that isn't JSON", async () => {
    const res = await collect("not json", { Origin: "https://example.com" })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: { code: "bad_request", message: "Body must be JSON" },
    })
  })

  it("answers 400 naming the field for a malformed payload", async () => {
    const site = await siteForNewUser()

    const res = await collect(pageview(site.id, { visitorId: "not-a-uuid" }), {
      Origin: `https://${site.domain}`,
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({
      error: {
        code: "bad_request",
        message: expect.stringMatching(/^visitorId/),
      },
    })
  })

  it("rejects a body over 4 KB before reading it", async () => {
    const site = await siteForNewUser()

    const res = await collect(
      pageview(site.id, { referrer: `https://a.com/${"x".repeat(4096)}` }),
      { Origin: `https://${site.domain}` }
    )

    expect(res.status).toBe(413)
    expect(await eventRows(site.id)).toEqual([])
  })

  it("allows any origin, without credentials", async () => {
    const res = await app.request(
      "/api/v1/collect",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://example.com",
          "Access-Control-Request-Method": "POST",
        },
      },
      env
    )

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*")
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBeNull()
  })
})

describe("site cache", () => {
  it("picks up a site created after a lookup of its id once the cached miss expires", async () => {
    const { userId } = await signIn()
    const siteId = createId("vt")
    const domain = uniqueDomain()
    const startedAt = Date.now()
    const eventAt = (msLater: number) =>
      ingestEvent(db, {
        payload: pageview(siteId),
        origin: `https://${domain}`,
        userAgent: CHROME_ON_MAC,
        country: "DE",
        now: new Date(startedAt + msLater),
      })
    const UNKNOWN = { status: "dropped", reason: "unknown_site" }

    expect(await eventAt(0)).toEqual(UNKNOWN)
    await db
      .insert(sites)
      .values({ id: siteId, ownerId: userId, name: "Late", domain })
    expect(await eventAt(59_000)).toEqual(UNKNOWN)
    expect(await eventAt(61_000)).toEqual({ status: "recorded" })
  })
})

describe("path", () => {
  it("caps a path that percent-encoding made longer than the URL limit", async () => {
    const site = await siteForNewUser()

    await collect(
      pageview(site.id, { url: `https://${site.domain}/${"一".repeat(1000)}` }),
      { Origin: `https://${site.domain}` }
    )

    const [event] = await eventRows(site.id)
    const [visitor] = await visitorRows(site.id)
    expect(event?.path).toHaveLength(1024)
    expect(event?.path.startsWith("/%E4%B8%80")).toBe(true)
    expect(visitor?.firstLandingPath).toBe(event?.path)
  })
})
