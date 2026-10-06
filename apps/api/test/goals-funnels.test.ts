import {
  FUNNEL_MAX_PER_SITE,
  funnelListResponseSchema,
  funnelResponseSchema,
  statsFunnelResponseSchema,
  statsGoalsResponseSchema,
} from "@workspace/contracts"
import { createDb, createId, insertFunnel } from "@workspace/db"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import { getStatsFunnel, getStatsGoals } from "../src/api/v1/stats/stats.goals"
import { api, createSite, insertPageviews, signIn } from "./helpers"

// Expected numbers follow docs/metrics.md#goals and #funnels.

const db = createDb(env.DB)

/** Tuesday noon UTC. The 7d range starts 2026-09-30T00:00Z in UTC. */
const NOW = new Date("2026-10-06T12:00:00.000Z")
const WEEK = { range: "7d", offset: 0 } as const

const newSite = () => ({ id: createId("vt"), timezone: "UTC" })

const goal = (visitor: string, name: string, at: string) => ({
  visitor,
  session: `s-${visitor}`,
  at,
  name,
})

describe("stats goals", () => {
  it("lists goals by distinct visitors, with completions and a line per day", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      goal("v1", "signup", "2026-10-01T09:00:00.000Z"),
      goal("v1", "signup", "2026-10-01T09:05:00.000Z"),
      goal("v2", "signup", "2026-10-03T09:00:00.000Z"),
      goal("v3", "checkout", "2026-10-03T10:00:00.000Z"),
      // Not goals: a pageview and an outbound click.
      { visitor: "v4", session: "s-v4", at: "2026-10-03T10:00:00.000Z" },
      goal("v4", "outbound", "2026-10-03T10:00:00.000Z"),
    ])

    const response = await getStatsGoals(db, site, WEEK, NOW)

    const { goals, buckets } = statsGoalsResponseSchema.parse(response)
    expect(buckets).toHaveLength(7)
    expect(goals).toEqual([
      {
        name: "signup",
        visitors: 2,
        completions: 3,
        series: [0, 1, 0, 1, 0, 0, 0],
      },
      {
        name: "checkout",
        visitors: 1,
        completions: 1,
        series: [0, 0, 0, 1, 0, 0, 0],
      },
    ])
  })

  it("keeps goals of sessions that match the filters", async () => {
    const site = newSite()
    await insertPageviews(site.id, [
      {
        visitor: "v1",
        session: "s-v1",
        at: "2026-10-01T08:00:00.000Z",
        source: "google",
      },
      goal("v1", "signup", "2026-10-01T09:00:00.000Z"),
      {
        visitor: "v2",
        session: "s-v2",
        at: "2026-10-01T08:00:00.000Z",
        source: "x",
      },
      goal("v2", "signup", "2026-10-01T09:00:00.000Z"),
    ])

    const { goals } = await getStatsGoals(
      db,
      site,
      { ...WEEK, source: "google" },
      NOW
    )

    expect(goals).toMatchObject([{ name: "signup", visitors: 1 }])
  })
})

describe("stats funnel", () => {
  it("counts visitors who reach each step in order, at or after the one before", async () => {
    const site = await createSite((await signIn()).userId)
    const funnel = await insertFunnel(db, {
      siteId: site.id,
      name: "Signup",
      steps: [
        { type: "page", value: "/" },
        { type: "page", value: "/pricing" },
        { type: "goal", value: "signup" },
      ],
    })
    if (!funnel) throw new Error("No funnel")
    const view = (visitor: string, path: string, at: string) => ({
      visitor,
      session: `s-${visitor}`,
      at,
      path,
    })
    await insertPageviews(site.id, [
      // v1 does all three in order.
      view("v1", "/", "2026-10-01T09:00:00.000Z"),
      view("v1", "/pricing", "2026-10-01T09:01:00.000Z"),
      goal("v1", "signup", "2026-10-01T09:02:00.000Z"),
      // v2 saw pricing before the home page: only step 1 counts.
      view("v2", "/pricing", "2026-10-01T09:00:00.000Z"),
      view("v2", "/", "2026-10-01T09:01:00.000Z"),
      // v3 reaches pricing, then signs up on another day.
      view("v3", "/", "2026-10-02T09:00:00.000Z"),
      view("v3", "/pricing", "2026-10-02T09:01:00.000Z"),
      goal("v3", "signup", "2026-10-04T09:00:00.000Z"),
      // v4 never saw the home page.
      view("v4", "/pricing", "2026-10-02T09:00:00.000Z"),
      goal("v4", "signup", "2026-10-02T09:01:00.000Z"),
    ])

    const response = await getStatsFunnel(
      db,
      site,
      { ...WEEK, funnel: funnel.id },
      NOW
    )

    const { steps } = statsFunnelResponseSchema.parse(response)
    expect(steps).toEqual([{ visitors: 3 }, { visitors: 2 }, { visitors: 2 }])
  })

  it("answers 404 for a funnel of another site", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)
    const other = await createSite((await signIn()).userId)
    const theirs = await insertFunnel(db, {
      siteId: other.id,
      name: "Theirs",
      steps: [
        { type: "page", value: "/" },
        { type: "page", value: "/x" },
      ],
    })

    const response = await api(
      `/sites/${site.id}/stats/funnel?range=7d&funnel=${theirs?.id}`,
      { cookie: owner.cookie }
    )

    expect(response.status).toBe(404)
  })
})

describe("funnels routes", () => {
  const STEPS = [
    { type: "page", value: "/" },
    { type: "goal", value: "signup" },
  ]

  function post(siteId: string, cookie: string, body: unknown) {
    return api(
      `/sites/${siteId}/funnels`,
      { cookie },
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }
    )
  }

  it("creates, lists and deletes the owner's funnels", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)

    const created = await post(site.id, owner.cookie, {
      name: " Signup ",
      steps: STEPS,
    })
    expect(created.status).toBe(201)
    const { funnel } = funnelResponseSchema.parse(await created.json())
    expect(funnel).toMatchObject({ name: "Signup", steps: STEPS })

    const listed = await api(`/sites/${site.id}/funnels`, {
      cookie: owner.cookie,
    })
    expect(funnelListResponseSchema.parse(await listed.json())).toMatchObject({
      funnels: [{ id: funnel.id }],
    })

    const deleted = await api(
      `/sites/${site.id}/funnels/${funnel.id}`,
      { cookie: owner.cookie },
      { method: "DELETE" }
    )
    expect(deleted.status).toBe(204)
  })

  it.each([
    ["one step", { name: "x", steps: [STEPS[0]] }],
    [
      "a page without a slash",
      { name: "x", steps: [{ type: "page", value: "pricing" }, STEPS[1]] },
    ],
    [
      "a reserved goal name",
      { name: "x", steps: [STEPS[0], { type: "goal", value: "pageview" }] },
    ],
    ["no name", { name: " ", steps: STEPS }],
  ])("answers 400 for %s", async (_, body) => {
    const owner = await signIn()
    const site = await createSite(owner.userId)

    expect((await post(site.id, owner.cookie, body)).status).toBe(400)
  })

  it(`stops at ${FUNNEL_MAX_PER_SITE} funnels per site`, async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)
    for (let index = 0; index < FUNNEL_MAX_PER_SITE; index++) {
      await insertFunnel(db, {
        siteId: site.id,
        name: `f${index}`,
        steps: [
          { type: "page", value: "/" },
          { type: "page", value: "/x" },
        ],
      })
    }

    const response = await post(site.id, owner.cookie, {
      name: "one more",
      steps: STEPS,
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({
      error: { code: "funnel_limit_reached" },
    })
  })

  it("answers 401 when signed out", async () => {
    const site = await createSite((await signIn()).userId)

    expect((await api(`/sites/${site.id}/funnels`)).status).toBe(401)
  })

  it("answers 404 for another user's site and leaves their funnel alone", async () => {
    const owner = await signIn()
    const intruder = await signIn()
    const site = await createSite(owner.userId)
    const funnel = await insertFunnel(db, {
      siteId: site.id,
      name: "Mine",
      steps: [
        { type: "page", value: "/" },
        { type: "page", value: "/x" },
      ],
    })

    const listed = await api(`/sites/${site.id}/funnels`, {
      cookie: intruder.cookie,
    })
    const created = await post(site.id, intruder.cookie, {
      name: "x",
      steps: STEPS,
    })
    const deleted = await api(
      `/sites/${site.id}/funnels/${funnel?.id}`,
      { cookie: intruder.cookie },
      { method: "DELETE" }
    )

    expect([listed.status, created.status, deleted.status]).toEqual([
      404, 404, 404,
    ])
    const stillThere = await api(`/sites/${site.id}/funnels`, {
      cookie: owner.cookie,
    })
    expect(
      funnelListResponseSchema.parse(await stillThere.json()).funnels
    ).toHaveLength(1)
  })

  it("answers 404 when deleting a funnel of another of the user's sites", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)
    const otherSite = await createSite(owner.userId)
    const funnel = await insertFunnel(db, {
      siteId: otherSite.id,
      name: "Other",
      steps: [
        { type: "page", value: "/" },
        { type: "page", value: "/x" },
      ],
    })

    const deleted = await api(
      `/sites/${site.id}/funnels/${funnel?.id}`,
      { cookie: owner.cookie },
      { method: "DELETE" }
    )

    expect(deleted.status).toBe(404)
  })
})
