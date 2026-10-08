---
paths:
  - "apps/api/**"
---

# API (apps/api)

- Layering inside `src/api/v1/<module>/`: `.routes.ts` parses input (zod in
  `.schema.ts`) and calls `.service.ts`; services take `(db, input)` and hold
  the logic; SQL lives in the service or `@workspace/db` queries. Routes never
  call `createDb` themselves except to pass it to a service.
- Modules never import another module. Shared code goes to `src/lib/`,
  `src/middleware/` or `packages/db/src/queries/`.
- Mount new modules in `src/api/v1/index.ts`. Customer-data routes use
  `requireUser` then `requireSite` and type the router with `SiteEnv`.
  `requireUserOrToken` also accepts read-only account tokens (the MCP
  server); opt a router in only when an AI client should read it.
- Throw `AppError(code, message)` for client errors. Add a code to
  `STATUS_BY_CODE` in `src/lib/errors.ts` only if none fits. Never return ad-hoc
  error JSON.
- Bindings and secrets come from `c.env`, validated by `src/config/env.ts`. A
  new secret needs an entry in `envSchema`, a fixed value in
  `vitest.config.ts` and a note for the user to set it with `wrangler secret`.
- Build per-request objects (`createAuth(env)`, `createDb(env.DB)`) inside the
  handler; no module-level state that holds bindings.
- Tests go in `apps/api/test/`, use `app.request(path, init, env)` with
  `env` from `cloudflare:workers`, and `signIn()`/`createSite()` from
  `test/helpers.ts`. Every owned-resource route gets a "user A can't see
  user B's data" test that expects 404.
- Skill: `add-api-module`.
