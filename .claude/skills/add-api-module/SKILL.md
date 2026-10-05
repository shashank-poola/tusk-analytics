---
name: add-api-module
description: Scaffolds a Hono module in apps/api/src/api/v1/<module>/ (routes, service, zod schema, Vitest test), mounts it in api/v1/index.ts and wires the requireUser/requireSite ownership checks. Use when adding an API endpoint or resource to apps/api, such as sites, goals, reports or integrations.
---

# Add an API module

No module exists yet. `apps/api/src/api/v1/index.ts` holds one temporary
route (`GET /sites/:siteId`) that the first real module, `sites`, replaces.
The templates in [references/templates.md](references/templates.md) were
compiled and tested against this repo.

## Layout

```
apps/api/src/api/v1/<module>/
  <module>.schema.ts    zod input schemas + inferred types
  <module>.service.ts   logic + queries: (db, ...) => result; no Hono
  <module>.routes.ts    Hono router: middleware, validation, status codes
apps/api/test/<module>.test.ts
```

## Steps

1. **Classify the routes.** Owned data (anything about a site) goes behind
   `requireUser` then `requireSite` on a `:siteId` param. Public endpoints
   (collect, webhooks) use neither; see the `ingest-pipeline` and
   `add-payment-provider` skills.
2. **Validation helper.** If `apps/api/src/lib/validate.ts` doesn't exist,
   create it from the template. It turns zod failures into
   `AppError("bad_request")` and malformed JSON into Hono's 400. Never call
   `schema.parse()` in a route: a `ZodError` becomes a 500.
3. **Write schema → service → routes** from the templates. Type the router
   `Hono<UserEnv>` and start it with `.use(requireUser)`; add `requireSite` per
   route that has `:siteId`.
4. **Mount** in `src/api/v1/index.ts`: `v1.route("/<module>", <module>Routes)`.
   When `sites` lands, delete the temporary route and point the last test in
   `test/errors.test.ts` at a real route.
5. **Test** with the template: happy path, 400 on bad input, 401 signed out,
   and the cross-tenant case (user A gets 404 for user B's resource).
6. Run `bun run typecheck`, `bun run test`, `bun run lint`.

## Rules

- Services take `db: Database` (from `@workspace/db`) and plain values: never
  a Hono `Context`. They throw `AppError`, never return error objects.
- Every query on customer data filters by `siteId` from `c.get("site")` or by
  `ownerId` from `c.get("user").id`, never by an id from the body alone.
- Reusable queries go to `packages/db/src/queries/`; module-only queries stay
  in the service.
- Modules don't import each other. Shared code moves to `src/lib/`.
- Responses: `c.json({ <noun>: data })`, 201 for creates. Errors use the
  `{ error: { code, message } }` shape from `src/lib/errors.ts`.
- New secret or binding: add it to `envSchema` in `src/config/env.ts` and to
  the fixed test bindings in `apps/api/vitest.config.ts`.
