# @workspace/db

Drizzle schema and client for Viewtally's Cloudflare D1 database (`viewtally`).

## Layout

```
src/
  index.ts          public API: createDb, tables, types, drizzle operators
  client.ts         createDb(env.DB)
  lib/id.ts         createId("vt") → "vt_3k9x2m7qpd4n8r1t"
  schema/
    columns.ts      shared timestamp columns (unix ms ↔ Date)
    auth.ts         Better Auth: user, session, account, verification, rate_limit
    sites.ts        sites
    tracking.ts     visitors, events
    revenue.ts      integrations, payments
    relations.ts    for db.query.*.findMany({ with })
  queries/          reusable typed queries (revenue, sites)
migrations/         generated SQL; applied by wrangler
```

## Usage

```ts
import { createDb, sites, eq } from "@workspace/db"

const db = createDb(env.DB)
const mySites = await db.select().from(sites).where(eq(sites.ownerId, userId))
```

## Changing the schema

1. Edit `src/schema/*.ts`.
2. `bun run db:generate` writes a new SQL file to `migrations/`. Review it.
3. `bun run db:migrate` applies it to the local database (`.wrangler/state` at the repo root).
4. `bun run db:migrate:remote` applies it to the real D1 database.

Never edit a migration that has already been applied remotely. Add a new one.

`bun run db:studio` opens Drizzle Studio on the local database. Use
`db:studio:remote` (run inside this package) for the real one. It needs
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID` and `CLOUDFLARE_D1_TOKEN`.

## Rules

- Every query a user can trigger must filter by sites they own (`sites.ownerId`).
- Timestamps are unix milliseconds, exposed as `Date`.
- Money is integer minor units. `payments.amountUsd` is what gets summed.
- Insert payments with `.onConflictDoNothing()`. Webhooks are retried.
