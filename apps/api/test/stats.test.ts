import {
  statsBreakdownResponseSchema,
  statsLiveResponseSchema,
  statsOverviewResponseSchema,
  statsTimeseriesResponseSchema,
  statsVisitorsResponseSchema,
} from "@workspace/contracts"
import { createDb, createId } from "@workspace/db"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import {
  getStatsBreakdown,
  getStatsLive,
  getStatsOverview,
  getStatsTimeseries,
  getStatsVisitors,
} from "../src/api/v1/stats/stats.service"
import {
  api,
  createSite,
  insertPageviews,
  type Pageview,
  signIn,
} from "./helpers"

// Expected numbers follow docs/metrics.md.

const db = createDb(env.DB)

/** Tuesday noon UTC. The 7d range starts 2026-09-30T00:00Z in UTC. */
const NOW = new Date("2026-10-06T12:00:00.000Z")

function preset(range: "24h" | "7d" | "30d" | "90d") {
  return { range, offset: 0 }
}

function newSite(timezone = "UTC") {
  return { id: createId("vt"), timezone }
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

    const overview = await getStatsOverview(db, site, preset("7d"), NOW)

    expect(statsOverviewResponseSchema.parse(overview)).toEqual({
      range: {
        from: "2026-09-30T00:00:00.000Z",
        to: "2026-10-06T12:00:00.000Z",
        previousFrom: "2026-09-23T12:00:00.000Z",
        previousTo: "2026-09-30T00:00:00.000Z",
      },
      current: {
        visitors: 3,
        pageviews: 7,
        sessions: 4,
        bounceRate: 0.5,
        // (120 s + 0 + 0 + 3599.999 s) / 4 sessions.
        avgSessionSeconds: expect.closeTo(929.99975, 5),
      },
      previous: {
        visitors: 1,
        pageviews: 1,
        sessions: 1,
        bounceRate: 1,
        avgSessionSeconds: 0,
      },
    })
  })

  it("returns zeros and a bounce rate of 0 when there are no pageviews", async () => {
    const overview = await getStatsOverview(db, newSite(), preset("30d"), NOW)

    const zero = {
      visitors: 0,
      pageviews: 0,
      sessions: 0,
      bounceRate: 0,
      avgSessionSeconds: 0,
    }
    expect(overview.current).toEqual(zero)
    expect(overview.previous).toEqual(zero)
  })

  it("averages session time over sessions, counting only pageviews in the range", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      // 90 s, with a page in between.
      { visitor: "v1", session: "s1", at: "2026-10-05T09:00:00.000Z" },
      { visitor: "v1", session: "s1", at: "2026-10-05T09:00:30.000Z" },
      { visitor: "v1", session: "s1", at: "2026-10-05T09:01:30.000Z" },
      // A bounce: 0 s.
      { visitor: "v2", session: "s2", at: "2026-10-05T10:00:00.000Z" },
      // Started before the range: only 00:00 → 00:00:30 is inside, 30 s.
      { visitor: "v3", session: "s3", at: "2026-09-29T23:59:00.000Z" },
      { visitor: "v3", session: "s3", at: "2026-09-30T00:00:00.000Z" },
      { visitor: "v3", session: "s3", at: "2026-09-30T00:00:30.000Z" },
      // A custom event doesn't stretch the session.
      {
        visitor: "v2",
        session: "s2",
        at: "2026-10-05T10:05:00.000Z",
        name: "signup",
      },
    ])

    const { current } = await getStatsOverview(db, site, preset("7d"), NOW)

    expect(current.sessions).toBe(3)
    expect(current.avgSessionSeconds).toBe(40)
  })

  it("starts the 24h range on the hour, 23 hours before the current one", async () => {
    const { range } = await getStatsOverview(
      db,
      newSite(),
      preset("24h"),
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
      preset("7d"),
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

    const overview = await getStatsOverview(db, site, preset("7d"), NOW)

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

    const timeseries = await getStatsTimeseries(db, site, preset("7d"), NOW)

    expect(statsTimeseriesResponseSchema.parse(timeseries)).toEqual({
      interval: "day",
      points: [
        {
          t: "2026-09-30T00:00:00.000+00:00",
          visitors: 0,
          pageviews: 0,
          topSource: null,
        },
        {
          t: "2026-10-01T00:00:00.000+00:00",
          visitors: 1,
          pageviews: 2,
          topSource: null,
        },
        {
          t: "2026-10-02T00:00:00.000+00:00",
          visitors: 0,
          pageviews: 0,
          topSource: null,
        },
        {
          t: "2026-10-03T00:00:00.000+00:00",
          visitors: 2,
          pageviews: 2,
          topSource: null,
        },
        {
          t: "2026-10-04T00:00:00.000+00:00",
          visitors: 0,
          pageviews: 0,
          topSource: null,
        },
        {
          t: "2026-10-05T00:00:00.000+00:00",
          visitors: 0,
          pageviews: 0,
          topSource: null,
        },
        {
          t: "2026-10-06T00:00:00.000+00:00",
          visitors: 0,
          pageviews: 0,
          topSource: null,
        },
      ],
      previousPoints: expect.any(Array),
      inProgress: true,
    })
  })

  it("puts a pageview at 20:00 UTC on the next local day in Asia/Kolkata", async () => {
    const site = newSite("Asia/Kolkata")
    await insertPageviews(site.id, [
      // 2026-10-05 01:30 in Kolkata.
      { visitor: "v1", session: "s1", at: "2026-10-04T20:00:00.000Z" },
    ])

    const { points } = await getStatsTimeseries(db, site, preset("7d"), NOW)

    expect(points).toHaveLength(7)
    expect(points.find((p) => p.pageviews > 0)).toMatchObject({
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

    const timeseries = await getStatsTimeseries(db, site, preset("24h"), NOW)

    expect(timeseries.interval).toBe("hour")
    expect(timeseries.points).toHaveLength(24)
    expect(timeseries.points[0]?.t).toBe("2026-10-05T13:00:00.000+00:00")
    expect(timeseries.points.at(-1)?.t).toBe("2026-10-06T12:00:00.000+00:00")
    expect(timeseries.points.at(-2)).toMatchObject({
      t: "2026-10-06T11:00:00.000+00:00",
      visitors: 2,
      pageviews: 2,
    })
  })

  it("buckets by Monday-start weeks and by local months", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      // Sunday 2026-10-04 and Monday 2026-10-05: two different weeks.
      { visitor: "v1", session: "s1", at: "2026-10-04T23:00:00.000Z" },
      { visitor: "v1", session: "s2", at: "2026-10-05T01:00:00.000Z" },
      { visitor: "v2", session: "s3", at: "2026-09-15T10:00:00.000Z" },
    ])

    const weeks = await getStatsTimeseries(
      db,
      site,
      { ...preset("7d"), interval: "week" },
      NOW
    )
    const months = await getStatsTimeseries(
      db,
      site,
      { ...preset("90d"), interval: "month" },
      NOW
    )

    expect(weeks.points).toMatchObject([
      { t: "2026-09-28T00:00:00.000+00:00", visitors: 1, pageviews: 1 },
      { t: "2026-10-05T00:00:00.000+00:00", visitors: 1, pageviews: 1 },
    ])
    expect(months.points.map((point) => point.t.slice(0, 10))).toEqual([
      "2026-07-01",
      "2026-08-01",
      "2026-09-01",
      "2026-10-01",
    ])
    expect(months.points.at(-2)).toMatchObject({ visitors: 1, pageviews: 1 })
    expect(months.points.at(-1)).toMatchObject({ visitors: 1, pageviews: 2 })
  })

  it("steps whole periods back with offset, with nothing in progress", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      { visitor: "v1", session: "s1", at: "2026-09-29T10:00:00.000Z" },
    ])

    const timeseries = await getStatsTimeseries(
      db,
      site,
      { range: "7d", offset: 1 },
      NOW
    )

    expect(timeseries.inProgress).toBe(false)
    expect(timeseries.points[0]?.t).toBe("2026-09-23T00:00:00.000+00:00")
    expect(timeseries.points.at(-1)).toMatchObject({
      t: "2026-09-29T00:00:00.000+00:00",
      visitors: 1,
      pageviews: 1,
    })
  })

  it("covers every day of a custom period in the site's time zone", async () => {
    const timeseries = await getStatsTimeseries(
      db,
      newSite("Asia/Kolkata"),
      { range: "custom", from: "2026-09-01", to: "2026-09-03" },
      NOW
    )

    expect(timeseries.points.map((point) => point.t)).toEqual([
      "2026-09-01T00:00:00.000+05:30",
      "2026-09-02T00:00:00.000+05:30",
      "2026-09-03T00:00:00.000+05:30",
    ])
    expect(timeseries.inProgress).toBe(false)
  })

  it("refuses hourly buckets over more than 31 days", async () => {
    await expect(
      getStatsTimeseries(
        db,
        newSite(),
        { ...preset("90d"), interval: "hour" },
        NOW
      )
    ).rejects.toThrow("interval: hourly buckets need a period of 31 days")
  })

  it("pairs each point with the same bucket of the full period before", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      // Tuesday a week before NOW's Tuesday: the last previous point.
      { visitor: "v1", session: "s1", at: "2026-09-29T08:00:00.000Z" },
      { visitor: "v2", session: "s2", at: "2026-09-29T09:00:00.000Z" },
      // Wednesday 2026-09-23: the first previous point.
      { visitor: "v3", session: "s3", at: "2026-09-23T09:00:00.000Z" },
    ])

    const { points, previousPoints } = await getStatsTimeseries(
      db,
      site,
      preset("7d"),
      NOW
    )

    expect(previousPoints).toHaveLength(points.length)
    expect(previousPoints[0]).toEqual({
      t: "2026-09-23T00:00:00.000+00:00",
      visitors: 1,
      pageviews: 1,
    })
    expect(previousPoints.at(-1)).toEqual({
      t: "2026-09-29T00:00:00.000+00:00",
      visitors: 2,
      pageviews: 2,
    })
  })

  it("names each bucket's top source by its sessions' first pageview, never direct", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      // Thursday: google brings two visitors, x one, direct three.
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-01T09:00:00.000Z",
        source: "google",
      },
      {
        visitor: "v2",
        session: "s2",
        at: "2026-10-01T10:00:00.000Z",
        source: "google",
      },
      {
        visitor: "v3",
        session: "s3",
        at: "2026-10-01T11:00:00.000Z",
        source: "x",
      },
      { visitor: "v4", session: "s4", at: "2026-10-01T12:00:00.000Z" },
      { visitor: "v5", session: "s5", at: "2026-10-01T12:00:00.000Z" },
      { visitor: "v6", session: "s6", at: "2026-10-01T12:00:00.000Z" },
      // A session from x whose later pageviews are direct still counts as x.
      {
        visitor: "v7",
        session: "s7",
        at: "2026-10-02T09:00:00.000Z",
        source: "x",
      },
      { visitor: "v7", session: "s7", at: "2026-10-02T09:01:00.000Z" },
    ])

    const { points } = await getStatsTimeseries(db, site, preset("7d"), NOW)

    expect(points.map((point) => point.topSource)).toEqual([
      null,
      "google",
      "x",
      null,
      null,
      null,
      null,
    ])
  })
})

describe("stats breakdown", () => {
  const period = preset("7d")

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
      { ...period, by: "source", limit: 10 },
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
      { ...period, by: "page", limit: 10 },
      NOW
    )

    expect(rows).toEqual([
      { key: "/pricing", visitors: 2, pageviews: 2 },
      { key: "/", visitors: 1, pageviews: 2 },
    ])
  })

  it.each([
    ["country", "country", "IN", "US"],
    ["device", "device", "mobile", "desktop"],
    ["browser", "browser", "Chrome", "Safari"],
    ["os", "os", "Android", "iOS"],
    ["referrer", "referrer", "news.ycombinator.com", "t.co"],
    ["hostname", "hostname", "myapp.com", "www.myapp.com"],
  ] as const)(
    "groups by %s, with unknown values last",
    async (by, field, firstValue, secondValue) => {
      const site = newSite()
      const session = (
        visitor: string,
        value: string | null,
        at: string
      ): Pageview => ({
        visitor,
        session: `s-${visitor}`,
        at,
        [field]: value,
      })
      await insertPageviews(site.id, [
        session("v1", firstValue, "2026-10-05T09:00:00.000Z"),
        session("v2", firstValue, "2026-10-05T10:00:00.000Z"),
        session("v3", secondValue, "2026-10-05T11:00:00.000Z"),
        session("v4", null, "2026-10-05T12:00:00.000Z"),
      ])

      const { rows } = await getStatsBreakdown(
        db,
        site,
        { ...period, by, limit: 10 },
        NOW
      )

      expect(rows).toEqual([
        { key: firstValue, visitors: 2, pageviews: 2 },
        { key: secondValue, visitors: 1, pageviews: 1 },
        { key: null, visitors: 1, pageviews: 1 },
      ])
    }
  )

  it("puts each session in the channel of its first pageview's source and utm_medium", async () => {
    const site = newSite()
    const session = (
      visitor: string,
      source: string | null,
      utmMedium: string | null = null
    ): Pageview => ({
      visitor,
      session: `s-${visitor}`,
      at: "2026-10-05T09:00:00.000Z",
      source,
      utmMedium,
    })
    await insertPageviews(site.id, [
      session("v1", "direct"),
      session("v2", null),
      session("v3", "newsletter"),
      session("v4", "mailchimp", "Email"),
      session("v5", "github"),
      session("v6", "blog.example.com"),
      session("v7", "bing"),
      // Searched, then browsed: the internal pageview is direct.
      session("v8", "google"),
      { visitor: "v8", session: "s-v8", at: "2026-10-05T09:05:00.000Z" },
      session("v9", "x"),
      session("v10", "hackernews"),
      session("v11", "chatgpt"),
      // A paid medium wins over a search source.
      session("v12", "google", "CPC"),
    ])

    const { rows } = await getStatsBreakdown(
      db,
      site,
      { ...period, by: "channel", limit: 10 },
      NOW
    )

    expect(rows.map(({ topSources: _, ...row }) => row)).toEqual([
      { key: "direct", visitors: 2, pageviews: 2 },
      { key: "email", visitors: 2, pageviews: 2 },
      { key: "referral", visitors: 2, pageviews: 2 },
      { key: "search", visitors: 2, pageviews: 3 },
      { key: "social", visitors: 2, pageviews: 2 },
      { key: "ai", visitors: 1, pageviews: 1 },
      { key: "paid", visitors: 1, pageviews: 1 },
    ])
  })

  it("names each channel's top sources, most visitors first, unknown ones left out", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:00:00.000Z",
        source: "x",
      },
      {
        visitor: "v2",
        session: "s2",
        at: "2026-10-05T09:00:00.000Z",
        source: "reddit",
      },
      {
        visitor: "v3",
        session: "s3",
        at: "2026-10-05T09:00:00.000Z",
        source: "reddit",
      },
      {
        visitor: "v4",
        session: "s4",
        at: "2026-10-05T09:00:00.000Z",
        source: "youtube",
      },
      {
        visitor: "v5",
        session: "s5",
        at: "2026-10-05T09:00:00.000Z",
        source: "linkedin",
      },
      {
        visitor: "v6",
        session: "s6",
        at: "2026-10-05T09:00:00.000Z",
        source: null,
      },
    ])

    const { rows } = await getStatsBreakdown(
      db,
      site,
      { ...period, by: "channel", limit: 10 },
      NOW
    )

    expect(rows).toEqual([
      {
        key: "social",
        visitors: 5,
        pageviews: 5,
        topSources: ["reddit", "linkedin", "x"],
      },
      { key: "direct", visitors: 1, pageviews: 1, topSources: [] },
    ])
  })

  it("groups campaigns by their parameters and leaves out visits without one", async () => {
    const site = newSite()
    const tagged = (visitor: string, campaignParams: string | null) => ({
      visitor,
      session: `s-${visitor}`,
      at: "2026-10-05T09:00:00.000Z",
      campaignParams,
    })
    await insertPageviews(site.id, [
      tagged("v1", "ref=indiepage"),
      tagged("v2", "ref=indiepage"),
      tagged("v3", "utm_source=x&utm_campaign=launch"),
      tagged("v4", null),
    ])

    const { rows } = await getStatsBreakdown(
      db,
      site,
      { ...period, by: "campaign", limit: 10 },
      NOW
    )

    expect(rows).toEqual([
      { key: "ref=indiepage", visitors: 2, pageviews: 2 },
      { key: "utm_source=x&utm_campaign=launch", visitors: 1, pageviews: 1 },
    ])
  })

  it("counts outbound clicks per link, with distinct visitors", async () => {
    const site = newSite()
    const click = (visitor: string, url: string) => ({
      visitor,
      session: `s-${visitor}`,
      at: "2026-10-05T09:00:00.000Z",
      name: "outbound",
      props: { url },
    })
    await insertPageviews(site.id, [
      click("v1", "github.com/acme"),
      click("v1", "github.com/acme"),
      click("v2", "github.com/acme"),
      click("v3", "x.com/acme"),
      // A pageview is not a click.
      { visitor: "v4", session: "s-v4", at: "2026-10-05T09:00:00.000Z" },
    ])

    const { rows } = await getStatsBreakdown(
      db,
      site,
      { ...period, by: "exit_link", limit: 10 },
      NOW
    )

    expect(rows).toEqual([
      { key: "github.com/acme", visitors: 2, pageviews: 3 },
      { key: "x.com/acme", visitors: 1, pageviews: 1 },
    ])
  })

  it("counts a session under its first path for entry pages and its last for exit pages", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      // Inserted out of order so first and last can only mean by time.
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:02:00.000Z",
        path: "/c",
      },
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:00:00.000Z",
        path: "/a",
      },
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:01:00.000Z",
        path: "/b",
      },
      {
        visitor: "v2",
        session: "s2",
        at: "2026-10-05T10:00:00.000Z",
        path: "/a",
      },
      {
        visitor: "v1",
        session: "s3",
        at: "2026-10-06T09:00:00.000Z",
        path: "/b",
      },
      {
        visitor: "v1",
        session: "s3",
        at: "2026-10-06T09:01:00.000Z",
        path: "/a",
      },
    ])

    const [entry, exit] = await Promise.all(
      (["entry_page", "exit_page"] as const).map((by) =>
        getStatsBreakdown(db, site, { ...period, by, limit: 10 }, NOW)
      )
    )

    expect(entry?.rows).toEqual([
      { key: "/a", visitors: 2, pageviews: 4 },
      { key: "/b", visitors: 1, pageviews: 2 },
    ])
    expect(exit?.rows).toEqual([
      { key: "/a", visitors: 2, pageviews: 3 },
      { key: "/c", visitors: 1, pageviews: 3 },
    ])
  })

  it("keeps cities with the same name in different countries apart", async () => {
    const site = newSite()
    const session = (
      visitor: string,
      country: string | null,
      city: string | null
    ): Pageview => ({
      visitor,
      session: `s-${visitor}`,
      at: "2026-10-05T09:00:00.000Z",
      country,
      city,
    })
    await insertPageviews(site.id, [
      session("v1", "FR", "Paris"),
      session("v2", "FR", "Paris"),
      session("v3", "US", "Paris"),
      session("v4", "US", "Austin"),
      session("v5", null, null),
      session("v6", "DE", null),
    ])

    const breakdown = await getStatsBreakdown(
      db,
      site,
      { ...period, by: "city", limit: 10 },
      NOW
    )

    expect(statsBreakdownResponseSchema.parse(breakdown).rows).toEqual([
      { key: "Paris", country: "FR", visitors: 2, pageviews: 2 },
      // One unknown row, whatever the visitors' countries.
      { key: null, country: null, visitors: 2, pageviews: 2 },
      { key: "Austin", country: "US", visitors: 1, pageviews: 1 },
      { key: "Paris", country: "US", visitors: 1, pageviews: 1 },
    ])
  })

  it("groups regions with their country, from the session's first pageview", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:00:00.000Z",
        country: "US",
        region: "California",
      },
      // Travelled mid-session: still counted under California.
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:05:00.000Z",
        country: "US",
        region: "Nevada",
      },
      {
        visitor: "v2",
        session: "s2",
        at: "2026-10-05T10:00:00.000Z",
        country: "US",
        region: "California",
      },
      {
        visitor: "v3",
        session: "s3",
        at: "2026-10-05T11:00:00.000Z",
        country: "DE",
        region: "Bayern",
      },
      {
        visitor: "v4",
        session: "s4",
        at: "2026-10-05T12:00:00.000Z",
        country: "US",
        region: null,
      },
      {
        visitor: "v5",
        session: "s5",
        at: "2026-10-05T13:00:00.000Z",
        country: "DE",
        region: null,
      },
    ])

    const { rows } = await getStatsBreakdown(
      db,
      site,
      { ...period, by: "region", limit: 10 },
      NOW
    )

    // Unknown regions from the US and DE collapse into one row.
    expect(rows).toEqual([
      { key: "California", country: "US", visitors: 2, pageviews: 3 },
      { key: null, country: null, visitors: 2, pageviews: 2 },
      { key: "Bayern", country: "DE", visitors: 1, pageviews: 1 },
    ])
  })

  it("leaves country off rows of other dimensions", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:00:00.000Z",
        country: "US",
      },
    ])

    const { rows } = await getStatsBreakdown(
      db,
      site,
      { ...period, by: "source", limit: 10 },
      NOW
    )

    expect(rows[0]).not.toHaveProperty("country")
  })

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
      { ...period, by: "source", limit: 2 },
      NOW
    )

    expect(rows.map((row) => row.key)).toEqual(["github", "bing"])
  })
})

describe("stats filters", () => {
  // Three sessions: s1 from google on mobile (/ then /pricing), s2 direct on
  // desktop (/ only, then clicks out), s3 from google on desktop (/blog).
  async function seed() {
    const site = newSite()
    await insertPageviews(site.id, [
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:00:00.000Z",
        source: "google",
        device: "mobile",
        country: "IN",
      },
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:01:00.000Z",
        path: "/pricing",
        device: "mobile",
        country: "IN",
      },
      {
        visitor: "v2",
        session: "s2",
        at: "2026-10-05T10:00:00.000Z",
        device: "desktop",
        country: "US",
      },
      {
        visitor: "v2",
        session: "s2",
        at: "2026-10-05T10:00:30.000Z",
        name: "outbound",
        props: { url: "github.com/acme" },
      },
      {
        visitor: "v3",
        session: "s3",
        at: "2026-10-05T11:00:00.000Z",
        path: "/blog",
        source: "google",
        device: "desktop",
        country: "US",
      },
    ])
    return site
  }

  it("keeps whole sessions by their first pageview's value", async () => {
    const site = await seed()

    const { current } = await getStatsOverview(
      db,
      site,
      { ...preset("7d"), source: "google" },
      NOW
    )

    // The internal /pricing pageview is stored as direct but stays in s1.
    expect(current).toMatchObject({ visitors: 2, pageviews: 3, sessions: 2 })
  })

  it("keeps sessions that viewed a page, with all their pageviews", async () => {
    const site = await seed()

    const { rows } = await getStatsBreakdown(
      db,
      site,
      { ...preset("7d"), page: "/pricing", by: "page", limit: 10 },
      NOW
    )

    expect(rows).toEqual([
      { key: "/", visitors: 1, pageviews: 1 },
      { key: "/pricing", visitors: 1, pageviews: 1 },
    ])
  })

  it("combines filters: sessions must match all of them", async () => {
    const site = await seed()

    const { current } = await getStatsOverview(
      db,
      site,
      { ...preset("7d"), source: "google", device: "desktop" },
      NOW
    )

    expect(current).toMatchObject({ visitors: 1, pageviews: 1 })
  })

  it("keeps sessions with a click on an outbound link", async () => {
    const site = await seed()

    const { visitors } = await getStatsVisitors(
      db,
      site,
      {
        ...preset("7d"),
        exit_link: "github.com/acme",
        limit: 10,
        secret: env.BETTER_AUTH_SECRET,
      },
      NOW
    )

    expect(visitors.map((visitor) => visitor.country)).toEqual(["US"])
  })

  it("filters the chart and its previous period alike", async () => {
    const site = await seed()

    const { points } = await getStatsTimeseries(
      db,
      site,
      { ...preset("7d"), channel: "search" },
      NOW
    )

    expect(points.reduce((sum, point) => sum + point.pageviews, 0)).toBe(3)
  })

  it("filters through the route's query string", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)

    const response = await api(
      `/sites/${site.id}/stats/overview?range=7d&country=IN&page=%2Fpricing`,
      { cookie: owner.cookie }
    )

    expect(response.status).toBe(200)
  })
})

describe("stats live", () => {
  it("counts distinct visitors with a pageview in the last 5 minutes before now", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      // Exactly 5 minutes ago: inside the window.
      { visitor: "v1", session: "s1", at: "2026-10-06T11:55:00.000Z" },
      { visitor: "v1", session: "s1", at: "2026-10-06T11:58:00.000Z" },
      { visitor: "v2", session: "s2", at: "2026-10-06T11:59:59.999Z" },
      // Not counted: 1 ms too early, at now, and a custom event.
      { visitor: "v3", session: "s3", at: "2026-10-06T11:54:59.999Z" },
      { visitor: "v4", session: "s4", at: "2026-10-06T12:00:00.000Z" },
      {
        visitor: "v5",
        session: "s5",
        at: "2026-10-06T11:59:00.000Z",
        name: "signup",
      },
    ])

    const live = await getStatsLive(db, site, NOW)

    expect(statsLiveResponseSchema.parse(live)).toEqual({ visitors: 2 })
  })
})

describe("stats visitors", () => {
  const listVisitors = (site: { id: string; timezone: string }, limit = 20) =>
    getStatsVisitors(
      db,
      site,
      { ...preset("7d"), limit, secret: env.BETTER_AUTH_SECRET },
      NOW
    )

  /** The pseudonym as specified, computed here independently of the API. */
  async function pseudonym(siteId: string, visitorId: string) {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.BETTER_AUTH_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`viewtally:visitor-pseudonym:v1:${siteId}:${visitorId}`)
    )
    return Array.from(new Uint8Array(signature), (byte) =>
      byte.toString(16).padStart(2, "0")
    )
      .join("")
      .slice(0, 24)
  }

  it("lists visitors latest first, with first-pageview details and their latest page", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      // v1: two sessions. Details from 09:00, latest page /docs.
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:05:00.000Z",
        path: "/pricing",
        country: "US",
      },
      {
        visitor: "v1",
        session: "s1",
        at: "2026-10-05T09:00:00.000Z",
        path: "/",
        source: "google",
        country: "US",
        region: "California",
        city: "San Francisco",
        device: "desktop",
        browser: "Chrome",
        os: "macOS",
      },
      {
        visitor: "v1",
        session: "s2",
        at: "2026-10-06T10:00:00.000Z",
        path: "/docs",
        source: "x",
        device: "mobile",
      },
      // A later custom event isn't the latest page.
      {
        visitor: "v1",
        session: "s2",
        at: "2026-10-06T10:30:00.000Z",
        path: "/checkout",
        name: "checkout_started",
      },
      { visitor: "v2", session: "s3", at: "2026-10-06T11:00:00.000Z" },
      // v3 arrived from reddit before the range; inside it, it's direct.
      {
        visitor: "v3",
        session: "s4",
        at: "2026-09-29T23:00:00.000Z",
        source: "reddit",
      },
      { visitor: "v3", session: "s4", at: "2026-10-01T08:00:00.000Z" },
      // Only at now, which is outside the range.
      { visitor: "v4", session: "s5", at: "2026-10-06T12:00:00.000Z" },
    ])

    const response = await listVisitors(site)

    const { visitors } = statsVisitorsResponseSchema.parse(response)
    expect(visitors.map((visitor) => visitor.id)).toEqual([
      await pseudonym(site.id, "v2"),
      await pseudonym(site.id, "v1"),
      await pseudonym(site.id, "v3"),
    ])
    expect(visitors[1]).toEqual({
      id: await pseudonym(site.id, "v1"),
      source: "google",
      country: "US",
      region: "California",
      city: "San Francisco",
      device: "desktop",
      browser: "Chrome",
      os: "macOS",
      pageviews: 3,
      sessions: 2,
      firstSeenAt: "2026-10-05T09:00:00.000Z",
      lastSeenAt: "2026-10-06T10:00:00.000Z",
      lastPage: "/docs",
      // Sep 30 → Oct 6: pageviews on Oct 5 and 6.
      activeDays: [false, false, false, false, false, true, true],
    })
    expect(visitors[2]).toMatchObject({
      source: "direct",
      pageviews: 1,
      firstSeenAt: "2026-10-01T08:00:00.000Z",
      // Sep 29 is before the week; Oct 1 is its second day.
      activeDays: [false, true, false, false, false, false, false],
    })
  })

  it("stops at the limit, keeping the latest visitors", async () => {
    const site = newSite()
    await insertPageviews(
      site.id,
      [1, 2, 3].map((hour) => ({
        visitor: `v${hour}`,
        session: `s${hour}`,
        at: `2026-10-05T0${hour}:00:00.000Z`,
      }))
    )

    const { visitors } = await listVisitors(site, 2)

    expect(visitors.map((visitor) => visitor.id)).toEqual([
      await pseudonym(site.id, "v3"),
      await pseudonym(site.id, "v2"),
    ])
  })

  it("returns a 24-character pseudonym instead of the tracker's visitor id", async () => {
    const site = newSite()
    const visitorId = crypto.randomUUID()
    await insertPageviews(site.id, [
      { visitor: visitorId, session: "s1", at: "2026-10-05T09:00:00.000Z" },
    ])

    const [visitor] = (await listVisitors(site)).visitors

    expect(visitor?.id).toMatch(/^[0-9a-f]{24}$/)
    expect(visitor?.id).not.toContain(visitorId)
    expect(visitor?.id).not.toContain(visitorId.replaceAll("-", ""))
  })

  it("keeps a visitor's pseudonym the same across requests", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      { visitor: "v1", session: "s1", at: "2026-10-05T09:00:00.000Z" },
    ])

    const first = await listVisitors(site)
    const second = await listVisitors(site)

    expect(second.visitors[0]?.id).toBe(first.visitors[0]?.id)
  })

  it("gives the same visitor id a different pseudonym on each site", async () => {
    const [siteA, siteB] = [newSite(), newSite()]
    for (const site of [siteA, siteB]) {
      await insertPageviews(site.id, [
        { visitor: "v1", session: "s1", at: "2026-10-05T09:00:00.000Z" },
      ])
    }

    const [a] = (await listVisitors(siteA)).visitors
    const [b] = (await listVisitors(siteB)).visitors

    expect(a?.id).toBeDefined()
    expect(a?.id).not.toBe(b?.id)
  })

  it("ignores other sites' visitors", async () => {
    const site = newSite()
    await insertPageviews(newSite().id, [
      { visitor: "v1", session: "s1", at: "2026-10-05T09:00:00.000Z" },
    ])

    const { visitors } = await listVisitors(site)

    expect(visitors).toEqual([])
  })
})

describe("stats routes", () => {
  const ROUTES = [
    "/stats/overview?range=7d",
    "/stats/timeseries?range=7d",
    "/stats/breakdown?range=7d&by=source",
    "/stats/live",
    "/stats/visitors?range=7d",
  ]

  it("returns the owner's stats in the shared contracts", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)
    const cookie = owner.cookie

    const [overview, timeseries, breakdown, live, visitors] = await Promise.all(
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
    expect(live?.status).toBe(200)
    expect(statsLiveResponseSchema.parse(await live?.json())).toEqual({
      visitors: 0,
    })
    expect(visitors?.status).toBe(200)
    expect(statsVisitorsResponseSchema.parse(await visitors?.json())).toEqual({
      visitors: [],
    })
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
    [
      "a limit over 250",
      "/stats/breakdown?range=7d&by=page&limit=251",
      "limit",
    ],
    [
      "a limit that isn't a number",
      "/stats/breakdown?range=7d&by=page&limit=ten",
      "limit",
    ],
    ["a visitors limit over 50", "/stats/visitors?range=7d&limit=51", "limit"],
    ["visitors without a range", "/stats/visitors", "range"],
    [
      "a custom period without an end",
      "/stats/overview?range=custom&from=2026-10-01",
      "to",
    ],
    [
      "a custom period that ends before it starts",
      "/stats/overview?range=custom&from=2026-10-02&to=2026-10-01",
      "to",
    ],
    ["a negative offset", "/stats/overview?range=7d&offset=-1", "offset"],
    [
      "hourly buckets over 90 days",
      "/stats/timeseries?range=90d&interval=hour",
      "interval",
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

  it("returns 20 visitors by default", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)
    const now = Date.now()
    await insertPageviews(
      site.id,
      Array.from({ length: 22 }, (_, index) => ({
        visitor: `v${index}`,
        session: `s${index}`,
        at: new Date(now - 60_000).toISOString(),
      }))
    )

    const response = await api(`/sites/${site.id}/stats/visitors?range=24h`, {
      cookie: owner.cookie,
    })

    const { visitors } = statsVisitorsResponseSchema.parse(
      await response.json()
    )
    expect(visitors).toHaveLength(20)
  })
})
