import {
  statsBreakdownResponseSchema,
  statsOverviewResponseSchema,
  statsTimeseriesResponseSchema,
} from "@workspace/contracts"
import {
  createDb,
  createId,
  type Device,
  events,
  type NewEvent,
} from "@workspace/db"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import {
  getStatsBreakdown,
  getStatsOverview,
  getStatsTimeseries,
} from "../src/api/v1/stats/stats.service"
import { api, createSite, signIn } from "./helpers"

// Expected numbers follow docs/metrics.md.

const db = createDb(env.DB)

/** Tuesday noon UTC. The 7d range starts 2026-09-30T00:00Z in UTC. */
const NOW = new Date("2026-10-06T12:00:00.000Z")

function newSite(timezone = "UTC") {
  return { id: createId("vt"), timezone }
}

type Pageview = {
  visitor: string
  session: string
  at: string
  path?: string
  name?: string
  source?: string | null
  country?: string | null
  device?: Device | null
  browser?: string | null
  os?: string | null
}

/** One insert per row: a multi-row insert would pass D1's 100-parameter cap. */
async function insertPageviews(siteId: string, pageviews: Pageview[]) {
  const [first, ...rest] = pageviews.map(({ visitor, session, at, ...row }) =>
    db.insert(events).values({
      path: "/",
      source: "direct",
      ...row,
      siteId,
      visitorId: visitor,
      sessionId: session,
      createdAt: new Date(at),
    } satisfies NewEvent)
  )
  if (first) await db.batch([first, ...rest])
}

describe("stats overview", () => {
  it("counts pageviews, visitors, sessions and bounce rate in the range", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      // v1: one three-page session and one bounce.
      { visitor: "v1", session: "s1", at: "2026-09-30T00:00:00.000Z" },
      { visitor: "v1", session: "s1", at: "2026-09-30T00:01:00.000Z" },
      { visitor: "v1", session: "s1", at: "2026-09-30T00:02:00.000Z" },
      { visitor: "v1", session: "s2", at: "2026-10-02T09:00:00.000Z" },
      // v2: a bounce.
      { visitor: "v2", session: "s3", at: "2026-10-03T09:00:00.000Z" },
      // v3: a two-page session.
      { visitor: "v3", session: "s4", at: "2026-10-06T11:00:00.000Z" },
      { visitor: "v3", session: "s4", at: "2026-10-06T11:59:59.999Z" },
      // Not counted: a custom event, and a pageview at `now` (ranges end
      // before `to`).
      {
        visitor: "v4",
        session: "s5",
        at: "2026-10-04T09:00:00.000Z",
        name: "signup",
      },
      { visitor: "v4", session: "s6", at: "2026-10-06T12:00:00.000Z" },
      // In the previous period: one millisecond before the range.
      { visitor: "v5", session: "s7", at: "2026-09-29T23:59:59.999Z" },
    ])

    const overview = await getStatsOverview(db, site, "7d", NOW)

    expect(statsOverviewResponseSchema.parse(overview)).toEqual({
      range: {
        from: "2026-09-30T00:00:00.000Z",
        to: "2026-10-06T12:00:00.000Z",
        previousFrom: "2026-09-23T12:00:00.000Z",
        previousTo: "2026-09-30T00:00:00.000Z",
      },
      current: { visitors: 3, pageviews: 7, sessions: 4, bounceRate: 0.5 },
      previous: { visitors: 1, pageviews: 1, sessions: 1, bounceRate: 1 },
    })
  })

  it("returns zeros and a bounce rate of 0 when there are no pageviews", async () => {
    const overview = await getStatsOverview(db, newSite(), "30d", NOW)

    const zero = { visitors: 0, pageviews: 0, sessions: 0, bounceRate: 0 }
    expect(overview.current).toEqual(zero)
    expect(overview.previous).toEqual(zero)
  })

  it("starts the 24h range on the hour, 23 hours before the current one", async () => {
    const { range } = await getStatsOverview(
      db,
      newSite(),
      "24h",
      new Date("2026-10-06T12:34:56.000Z")
    )

    expect(range).toEqual({
      from: "2026-10-05T13:00:00.000Z",
      to: "2026-10-06T12:34:56.000Z",
      previousFrom: "2026-10-04T13:25:04.000Z",
      previousTo: "2026-10-05T13:00:00.000Z",
    })
  })

  it("starts day ranges at the site's local midnight", async () => {
    const { range } = await getStatsOverview(
      db,
      newSite("Asia/Kolkata"),
      "7d",
      NOW
    )

    // 2026-09-30 00:00 in Kolkata (UTC+05:30).
    expect(range.from).toBe("2026-09-29T18:30:00.000Z")
  })

  it("ignores other sites' pageviews", async () => {
    const site = newSite()
    await insertPageviews(newSite().id, [
      { visitor: "v1", session: "s1", at: "2026-10-05T09:00:00.000Z" },
    ])

    const overview = await getStatsOverview(db, site, "7d", NOW)

    expect(overview.current.pageviews).toBe(0)
  })
})

describe("stats timeseries", () => {
  it("has one zero-filled point per day with distinct visitors per day", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      // v1 in two different hours of one day: one visitor that day.
      { visitor: "v1", session: "s1", at: "2026-10-01T09:10:00.000Z" },
      { visitor: "v1", session: "s2", at: "2026-10-01T15:10:00.000Z" },
      { visitor: "v1", session: "s3", at: "2026-10-03T09:00:00.000Z" },
      { visitor: "v2", session: "s4", at: "2026-10-03T10:00:00.000Z" },
    ])

    const timeseries = await getStatsTimeseries(db, site, "7d", NOW)

    expect(statsTimeseriesResponseSchema.parse(timeseries)).toEqual({
      interval: "day",
      points: [
        { t: "2026-09-30T00:00:00.000+00:00", visitors: 0, pageviews: 0 },
        { t: "2026-10-01T00:00:00.000+00:00", visitors: 1, pageviews: 2 },
        { t: "2026-10-02T00:00:00.000+00:00", visitors: 0, pageviews: 0 },
        { t: "2026-10-03T00:00:00.000+00:00", visitors: 2, pageviews: 2 },
        { t: "2026-10-04T00:00:00.000+00:00", visitors: 0, pageviews: 0 },
        { t: "2026-10-05T00:00:00.000+00:00", visitors: 0, pageviews: 0 },
        { t: "2026-10-06T00:00:00.000+00:00", visitors: 0, pageviews: 0 },
      ],
    })
  })

  it("puts a pageview at 20:00 UTC on the next local day in Asia/Kolkata", async () => {
    const site = newSite("Asia/Kolkata")
    await insertPageviews(site.id, [
      // 2026-10-05 01:30 in Kolkata.
      { visitor: "v1", session: "s1", at: "2026-10-04T20:00:00.000Z" },
    ])

    const { points } = await getStatsTimeseries(db, site, "7d", NOW)

    expect(points).toHaveLength(7)
    expect(points.find((p) => p.pageviews > 0)).toEqual({
      t: "2026-10-05T00:00:00.000+05:30",
      visitors: 1,
      pageviews: 1,
    })
  })

  it("has 24 hourly points for 24h, ending with the current hour", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      { visitor: "v1", session: "s1", at: "2026-10-06T11:30:00.000Z" },
      { visitor: "v2", session: "s2", at: "2026-10-06T11:45:00.000Z" },
    ])

    const timeseries = await getStatsTimeseries(db, site, "24h", NOW)

    expect(timeseries.interval).toBe("hour")
    expect(timeseries.points).toHaveLength(24)
    expect(timeseries.points[0]?.t).toBe("2026-10-05T13:00:00.000+00:00")
    expect(timeseries.points.at(-1)?.t).toBe("2026-10-06T12:00:00.000+00:00")
    expect(timeseries.points.at(-2)).toEqual({
      t: "2026-10-06T11:00:00.000+00:00",
      visitors: 2,
      pageviews: 2,
    })
  })
})

describe("stats breakdown", () => {
  const range = "7d"

  it("counts a session once, under the source of its first pageview", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      // Arrived from google, then browsed: ingest stores `direct` on the
      // internal pageviews. Inserted last so "first" can only mean earliest.
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:02:00.000Z",
        path: "/docs",
      },
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:01:00.000Z",
        path: "/pricing",
      },
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:00:00.000Z",
        source: "google",
      },
      { visitor: "v2", session: "s2", at: "2026-10-05T10:00:00.000Z" },
      // Started from x before the range: inside it, its first pageview is
      // internal, so it counts as direct.
      {
        visitor: "v3",
        session: "s3",
        at: "2026-09-29T23:59:00.000Z",
        source: "x",
      },
      { visitor: "v3", session: "s3", at: "2026-09-30T00:01:00.000Z" },
    ])

    const breakdown = await getStatsBreakdown(
      db,
      site,
      { range, by: "source", limit: 10 },
      NOW
    )

    expect(statsBreakdownResponseSchema.parse(breakdown)).toEqual({
      by: "source",
      rows: [
        { key: "direct", visitors: 2, pageviews: 2 },
        { key: "google", visitors: 1, pageviews: 3 },
      ],
    })
  })

  it("counts pages per pageview, with distinct visitors per path", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:00:00.000Z",
        path: "/",
      },
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:01:00.000Z",
        path: "/pricing",
      },
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:02:00.000Z",
        path: "/",
      },
      {
        visitor: "v2",
        session: "s2",
        at: "2026-10-05T10:00:00.000Z",
        path: "/pricing",
      },
    ])

    const { rows } = await getStatsBreakdown(
      db,
      site,
      { range, by: "page", limit: 10 },
      NOW
    )

    expect(rows).toEqual([
      { key: "/pricing", visitors: 2, pageviews: 2 },
      { key: "/", visitors: 1, pageviews: 2 },
    ])
  })

  it.each([
    ["country", "IN", "US"],
    ["device", "mobile", "desktop"],
    ["browser", "Chrome", "Safari"],
    ["os", "Android", "iOS"],
  ] as const)(
    "groups by %s, with unknown values last",
    async (by, firstValue, secondValue) => {
      const site = newSite()
      const session = (
        visitor: string,
        value: string | null,
        at: string
      ): Pageview => ({ visitor, session: `s-${visitor}`, at, [by]: value })
      await insertPageviews(site.id, [
        session("v1", firstValue, "2026-10-05T09:00:00.000Z"),
        session("v2", firstValue, "2026-10-05T10:00:00.000Z"),
        session("v3", secondValue, "2026-10-05T11:00:00.000Z"),
        session("v4", null, "2026-10-05T12:00:00.000Z"),
      ])

      const { rows } = await getStatsBreakdown(
        db,
        site,
        { range, by, limit: 10 },
        NOW
      )

      expect(rows).toEqual([
        { key: firstValue, visitors: 2, pageviews: 2 },
        { key: secondValue, visitors: 1, pageviews: 1 },
        { key: null, visitors: 1, pageviews: 1 },
      ])
    }
  )

  it("sorts by visitors, then key, and stops at the limit", async () => {
    const site = newSite()
    const pageview = (visitor: string, source: string): Pageview => ({
      visitor,
      session: `s-${visitor}`,
      at: "2026-10-05T09:00:00.000Z",
      source,
    })
    await insertPageviews(site.id, [
      pageview("v1", "x"),
      pageview("v2", "github"),
      pageview("v3", "github"),
      pageview("v4", "bing"),
    ])

    const { rows } = await getStatsBreakdown(
      db,
      site,
      { range, by: "source", limit: 2 },
      NOW
    )

    expect(rows.map((row) => row.key)).toEqual(["github", "bing"])
  })
})

describe("stats routes", () => {
  const ROUTES = [
    "/stats/overview?range=7d",
    "/stats/timeseries?range=7d",
    "/stats/breakdown?range=7d&by=source",
  ]

  it("returns the owner's stats in the shared contracts", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)
    const cookie = owner.cookie

    const [overview, timeseries, breakdown] = await Promise.all(
      ROUTES.map((path) => api(`/sites/${site.id}${path}`, { cookie }))
    )

    expect(overview?.status).toBe(200)
    statsOverviewResponseSchema.parse(await overview?.json())
    expect(timeseries?.status).toBe(200)
    expect(
      statsTimeseriesResponseSchema.parse(await timeseries?.json()).points
    ).toHaveLength(7)
    expect(breakdown?.status).toBe(200)
    expect(statsBreakdownResponseSchema.parse(await breakdown?.json())).toEqual(
      { by: "source", rows: [] }
    )
  })

  it.each(ROUTES)("answers 404 for another user's site on %s", async (path) => {
    const owner = await signIn()
    const other = await signIn()
    const site = await createSite(owner.userId)

    const response = await api(`/sites/${site.id}${path}`, {
      cookie: other.cookie,
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: { code: "not_found", message: "Site not found" },
    })
  })

  it.each(ROUTES)("answers 401 without a session on %s", async (path) => {
    const owner = await signIn()
    const site = await createSite(owner.userId)

    const response = await api(`/sites/${site.id}${path}`)

    expect(response.status).toBe(401)
  })

  it.each([
    ["an unknown range", "/stats/overview?range=1y", "range"],
    ["a missing range", "/stats/timeseries", "range"],
    [
      "a dimension outside the fixed list",
      "/stats/breakdown?range=7d&by=path",
      "by",
    ],
    ["a limit over 50", "/stats/breakdown?range=7d&by=page&limit=51", "limit"],
    [
      "a limit that isn't a number",
      "/stats/breakdown?range=7d&by=page&limit=ten",
      "limit",
    ],
  ])("answers 400 for %s", async (_, path, field) => {
    const owner = await signIn()
    const site = await createSite(owner.userId)

    const response = await api(`/sites/${site.id}${path}`, {
      cookie: owner.cookie,
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: {
        code: "bad_request",
        message: expect.stringMatching(`^${field}: `),
      },
    })
  })

  it("returns 10 breakdown rows by default", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)
    const now = Date.now()
    await insertPageviews(
      site.id,
      Array.from({ length: 12 }, (_, index) => ({
        visitor: `v${index}`,
        session: `s${index}`,
        at: new Date(now - 60_000).toISOString(),
        path: `/page-${index}`,
      }))
    )

    const response = await api(
      `/sites/${site.id}/stats/breakdown?range=24h&by=page`,
      {
        cookie: owner.cookie,
      }
    )

    const { rows } = statsBreakdownResponseSchema.parse(await response.json())
    expect(rows).toHaveLength(10)
  })
})
