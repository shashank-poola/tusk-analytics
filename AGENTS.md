# Viewtally

Web analytics for indie hackers and small SaaS teams: a tracking script, a
dashboard, and revenue attribution that links each payment to the traffic
source that first brought the customer.

## Commands

Run from the repo root. Bun 1.3 (`packageManager` in `package.json`), Turborepo.

| Task                       | Command                                               |
| -------------------------- | ----------------------------------------------------- |
| Install                    | `bun install --frozen-lockfile`                       |
| Dev (web :3000, API :8787) | `bun run dev`                                         |
| Lint / typecheck / test    | `bun run lint` · `bun run typecheck` · `bun run test` |
| Format (write) / check     | `bun run format` · `bun run format:check`             |
| Build                      | `bun run build`                                       |
| New migration from schema  | `bun run db:generate`                                 |
| Apply migrations locally   | `bun run db:migrate`                                  |
| Agent files + hook tests   | `bun run validate:agents` · `bun run test:tooling`    |
| Migration safety (vs main) | `bun run check:migrations`                            |

Local secrets: `apps/api/.dev.vars` (API) and `apps/web/.env` (copy
`.env.example`). Never read or print them.

## Architecture

- `apps/api`: Hono on Cloudflare Workers. `src/app.ts` mounts `/api/auth/*`
  (Better Auth, `src/auth/`) and `/api/v1` (`src/api/v1/index.ts`).
- API modules live in `src/api/v1/<module>/` as `<module>.routes.ts`,
  `.service.ts`, `.schema.ts`; tests in `apps/api/test/` run in workerd
  against an in-memory D1 (`@cloudflare/vitest-plugin`).
- Customer-data routes chain `requireUser` → `requireSite` (`src/middleware/`).
  Errors are `AppError` → `{ error: { code, message } }` (`src/lib/errors.ts`).
- `apps/web`: Next.js 16 dashboard. Browser only talks to it; `/api/*` is
  rewritten to the API Worker (`next.config.ts`), so auth cookies stay
  first-party.
- `packages/db`: Drizzle schema, queries and generated SQL migrations for one
  D1 database (`viewtally`). Apps import only from `@workspace/db`.
- `packages/ui`: shared Tailwind 4 stylesheet (`globals.css`); shadcn target.
- `packages/tracker`: the browser script customers install (not built yet).

## Hard rules

1. Every route that touches customer data checks ownership: mount it behind
   `requireUser` + `requireSite`, or filter by `sites.ownerId` in the query.
   Someone else's site answers 404, never 403.
2. No remote database access and no deploys from an agent: no `--remote`,
   `db:migrate:remote`, `wrangler deploy`, `wrangler secret`, `git push`.
   Hooks and permissions in `.claude/settings.json` enforce this.
3. Migrations are generated, additive and backward compatible. Never edit a
   committed migration; add a new one. D1 has no `BEGIN`/`COMMIT`: use
   `db.batch()`.
4. API modules don't import each other. Shared code goes to `src/lib/`,
   `src/middleware/` or `@workspace/db`.
5. No `any` (ESLint can't catch it here; reviewers do). Use `unknown` + zod.
6. Never trust referrer, UTM or other tracker input: validate with zod, cap
   lengths, and render it as text only.

## Agent tooling

- Skills: `.claude/skills/<name>/SKILL.md` (also read via `.agents/skills`).
- Subagents: `.claude/agents/` (code, security, D1 schema, privacy review;
  test writing).
- Path-scoped rules: `.claude/rules/`. Hook scripts: `.claude/scripts/`.
- Deploys: `.github/workflows/deploy.yml`, runbook `docs/runbooks/deploy.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
