# Deploy and rollback

## How a deploy runs

1. A push to `main` runs CI (`.github/workflows/ci.yml`). When every job
   passes, CI calls `.github/workflows/deploy.yml`.
2. The `api` job waits for approval on the `production` environment.
3. It reads which migrations production has applied, checks the pending
   ones are backward compatible, applies them
   (`wrangler d1 migrations apply viewtally --remote`), deploys
   `apps/api` (`wrangler deploy`), then smoke-tests the API.
4. The `web` job is a placeholder until the web host is chosen (below).

Manual run: Actions → Deploy → Run workflow → `main`. This skips CI, so use
it only to redeploy a commit that already passed.

**Why migrations must be backward compatible:** between steps "apply
migrations" and "deploy", the old Worker serves traffic on the new schema,
and after a rollback an old Worker can run on it for days.

## One-time setup

- Environment `production` with required reviewers, deployment branches
  limited to `main`, secrets `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID`, variable `API_BASE_URL` (for example
  `https://viewtally-api.<subdomain>.workers.dev`).
- Worker secrets, set once from your machine in `apps/api`:
  `bunx wrangler secret put <NAME>` for `BETTER_AUTH_URL`,
  `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `RESEND_API_KEY`, `EMAIL_FROM`. Use secrets, not dashboard variables:
  `wrangler deploy` overwrites dashboard variables with what's in
  `wrangler.jsonc` (which has none), but never touches secrets.

## Rollback

### API Worker (fast, safe)

The previous Worker version works with the current schema, because every
migration is backward compatible.

```sh
cd apps/api
bunx wrangler deployments list                         # find the bad deploy
bunx wrangler versions list                            # pick the version to restore
bunx wrangler rollback <version-id> --message "why"    # omit the id for "previous version"
```

Or in the dashboard: Workers & Pages → `viewtally-api` → Deployments →
Rollback. A rollback deploys an old version immediately, so the next push to
`main` deploys whatever is on `main` again: revert the bad commit too.

### Database (forward-only)

Don't undo a migration by hand. Write a new migration that fixes forward,
open a PR, and let the deploy apply it.

Last resort, for data corruption only: D1 Time Travel restores the whole
database to a point in time (30 days back on Workers Paid, 7 on Free). **It
overwrites the database in place and loses every write after that point:
pageviews, signups, payments.**

```sh
cd packages/db
bunx wrangler d1 time-travel info viewtally --timestamp="2026-10-05T12:00:00Z"
bunx wrangler d1 time-travel restore viewtally --bookmark=<bookmark>
```

After a restore, `d1_migrations` is restored too, so the next deploy
re-applies any migrations made after that point. Roll the Worker back to a
version that matches the restored schema first.

### Web

Depends on the host (not chosen yet). Cloudflare Workers: run
`wrangler rollback` as above, in `apps/web`. Vercel: Deployments → promote
the previous deployment.

## When the smoke test fails

The smoke test calls `GET $API_BASE_URL/api/v1/__smoke_test` and expects
`404 {"error":{"code":"not_found",...}}`.

- **500 `internal_error`**: usually a missing or invalid Worker secret
  (`assertValidEnv` lists them in the Worker logs: dashboard →
  `viewtally-api` → Logs). Add the secret; no redeploy needed.
- **Connection error or Cloudflare error page**: wrong `API_BASE_URL`, or
  the deploy didn't go live. Check Deployments.
- Otherwise roll back the Worker (above) and investigate.

## Choosing the web host

`apps/web` has no deploy config yet. Two options:

|                        | A. Cloudflare Workers via OpenNext (recommended)                                                                                   | B. Vercel                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Setup                  | Add `@opennextjs/cloudflare` + `apps/web/wrangler.jsonc`; deploy with `opennextjs-cloudflare deploy` in this workflow              | Import the repo in Vercel, root `apps/web`; Vercel deploys on push          |
| Next 16 support        | Supported per opennext.js.org (Node runtime, not edge)                                                                             | Native                                                                      |
| Fit                    | Same account, same token, same workflow. The `/api/*` rewrite to the API Worker can later become a Service Binding (no public hop) | Second provider and secret set; `/api/*` crosses the internet to the Worker |
| Extra token permission | none for scripts; R2 Edit if you use the R2 incremental cache                                                                      | none (Vercel has its own)                                                   |
| Previews               | Worker preview URLs (more setup)                                                                                                   | Per-PR previews out of the box                                              |

Both keep auth cookies first-party, because the browser only talks to the
web origin. Either way, the IP-based auth rate limit needs a fix: behind the
proxy, `cf-connecting-ip` is the proxy's IP (see the comment in
`apps/api/src/auth/auth.config.ts`).
