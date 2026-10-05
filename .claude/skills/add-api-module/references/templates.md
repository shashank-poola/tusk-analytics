# Templates (sites module as the example)

Compiled with `tsc --noEmit` and run under `@cloudflare/vitest-plugin`
against this repo. Rename `sites` to your module. Import paths assume the
real locations shown in each heading.

## apps/api/src/lib/validate.ts (create once)

```ts
import { validator } from "hono/validator"
import type * as z from "zod"

import { AppError } from "./errors"

/** Parses `value` with `schema`, or throws a 400 `AppError` naming the field. */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  value: unknown
): z.output<T> {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  const issue = result.error.issues[0]
  const field = issue?.path.join(".") || "body"
  throw new AppError("bad_request", `${field}: ${issue?.message ?? "invalid"}`)
}

/** Validates the JSON body; read it in the handler with `c.req.valid("json")`. */
export const jsonBody = <T extends z.ZodType>(schema: T) =>
  validator("json", (value) => parseOrThrow(schema, value))

/** Validates the query string; read it with `c.req.valid("query")`. */
export const queryParams = <T extends z.ZodType>(schema: T) =>
  validator("query", (value) => parseOrThrow(schema, value))
```

## apps/api/src/api/v1/sites/sites.schema.ts

```ts
import * as z from "zod"

export const createSiteSchema = z.object({
  name: z.string().trim().min(1).max(100),
  // Bare hostname: no scheme, path or port.
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/,
      "must be a bare hostname like myapp.com"
    ),
  timezone: z.string().trim().min(1).max(64).default("UTC"),
})

export type CreateSiteInput = z.infer<typeof createSiteSchema>
```

## apps/api/src/api/v1/sites/sites.service.ts

```ts
import { type Database, desc, eq, sites } from "@workspace/db"

import { AppError } from "../../../lib/errors"
import type { CreateSiteInput } from "./sites.schema"

export function listSites(db: Database, ownerId: string) {
  return db
    .select()
    .from(sites)
    .where(eq(sites.ownerId, ownerId))
    .orderBy(desc(sites.createdAt))
}

export async function createSite(
  db: Database,
  ownerId: string,
  input: CreateSiteInput
) {
  const [site] = await db
    .insert(sites)
    .values({ ...input, ownerId })
    .onConflictDoNothing({ target: [sites.ownerId, sites.domain] })
    .returning()
  if (!site) throw new AppError("bad_request", "You already track this domain")
  return site
}
```

## apps/api/src/api/v1/sites/sites.routes.ts

```ts
import { createDb } from "@workspace/db"
import { Hono } from "hono"

import type { UserEnv } from "../../../config/env"
import { jsonBody } from "../../../lib/validate"
import { requireSite } from "../../../middleware/require-site"
import { requireUser } from "../../../middleware/require-user"
import { createSiteSchema } from "./sites.schema"
import { createSite, listSites } from "./sites.service"

export const sitesRoutes = new Hono<UserEnv>()
  .use(requireUser)
  .get("/", async (c) => {
    const sites = await listSites(createDb(c.env.DB), c.get("user").id)
    return c.json({ sites })
  })
  .post("/", jsonBody(createSiteSchema), async (c) => {
    const site = await createSite(
      createDb(c.env.DB),
      c.get("user").id,
      c.req.valid("json")
    )
    return c.json({ site }, 201)
  })
  // requireSite answers 404 unless the signed-in user owns :siteId.
  .get("/:siteId", requireSite, (c) => c.json({ site: c.get("site") }))
```

## Mount: apps/api/src/api/v1/index.ts

```ts
import { sitesRoutes } from "./sites/sites.routes"

v1.route("/sites", sitesRoutes)
```

## apps/api/test/sites.test.ts

```ts
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import { app } from "../src/app"
import { createSite, signIn } from "./helpers"

function api(path: string, cookie: string, init: RequestInit = {}) {
  return app.request(
    `/api/v1${path}`,
    {
      ...init,
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
        ...init.headers,
      },
    },
    env
  )
}

describe("sites", () => {
  it("creates a site for the signed-in user", async () => {
    const owner = await signIn()

    const res = await api("/sites", owner.cookie, {
      method: "POST",
      body: JSON.stringify({
        name: "Blog",
        domain: `${crypto.randomUUID()}.com`,
      }),
    })

    expect(res.status).toBe(201)
    const { site } = (await res.json()) as { site: { ownerId: string } }
    expect(site.ownerId).toBe(owner.userId)
  })

  it("rejects invalid input with a 400 naming the field", async () => {
    const owner = await signIn()

    const res = await api("/sites", owner.cookie, {
      method: "POST",
      body: JSON.stringify({ name: "Blog", domain: "https://x.com/path" }),
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: { code: "bad_request" } })
  })

  it("lists only the caller's sites", async () => {
    const userA = await signIn()
    await createSite((await signIn()).userId)
    const mine = await createSite(userA.userId)

    const res = await api("/sites", userA.cookie)

    const { sites } = (await res.json()) as { sites: { id: string }[] }
    expect(sites.map((s) => s.id)).toEqual([mine.id])
  })

  it("answers 404 for another user's site", async () => {
    const userA = await signIn()
    const siteOfB = await createSite((await signIn()).userId)

    const res = await api(`/sites/${siteOfB.id}`, userA.cookie)

    expect(res.status).toBe(404)
  })
})
```

Each test signs in fresh users (`signIn()` uses a random IP to dodge the
D1-backed rate limit), so tests don't depend on each other's data.
