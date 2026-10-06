---
name: dashboard-ui
description: Conventions for the Next.js 16 dashboard in apps/web and shared UI in packages/ui, covering page and component structure, server-side data fetching through the API proxy, Tailwind styling as it exists today, auth-aware layouts and tests. Use when adding or changing pages, components, charts or data loading in apps/web.
---

# Dashboard UI (apps/web)

Next.js 16.3 (App Router, React 19.3, Tailwind 4). Next 16 has breaking
changes: check `node_modules/next/dist/docs/` before using an API from memory.

## What exists

```
apps/web/
  app/                      routes only: layouts and pages, no logic
    layout.tsx              fonts (Gellix, Geist Mono), ThemeProvider
    signup/                 sign-in page
    (dashboard)/            session gate + header; dashboard/, onboarding/,
                            settings/, sites/[siteId]/ (analytics)
  components/               shared, feature-agnostic UI
    ui/                     primitives: avatar, card (+ FIXED_CARD_HEIGHT), icon, menu
    layout/                 app chrome: dashboard-header, account-menu, theme-toggle
    brand/                  logo, tally-marks, google-icon
    providers/              theme-provider
  features/<feature>/       one folder per feature, same categories in each:
    components/             its UI (subfolders by page area when large)
    server/                 *.queries.ts (API reads) and *-action.ts (server actions)
    hooks/                  its client hooks
    utils/                  pure logic: parsing, formatting, labels
  hooks/                    shared hooks (use-dismiss)
  lib/                      app-wide plumbing: api-client, auth-client,
                            auth-errors, avatar (server), env, routes, session
  tests/                    mirrors the source paths (tests/features/analytics/utils/…);
                            shared fixtures in tests/fixtures/
packages/ui/src/
  styles/globals.css        Tailwind, design tokens (:root vars + @theme inline)
  lib/utils.ts              cn (clsx + tailwind-merge)
  components/chart.tsx      shadcn chart (recharts)
```

Features: `analytics`, `auth`, `onboarding`, `settings`, `sites`. A file
used by one feature lives in that feature; it moves to `components/`,
`hooks/` or `lib/` only once a second feature needs it. Import order:
packages, then shared `@/…`, then the same feature's `@/features/<x>/…`
(`./x` within one folder).

Not there yet: client-side data fetching (mutations and the two pollers go
through server actions).

## Analytics page

`features/analytics/`:

- `server/`: `analytics.queries.ts` (stats API, `cache`d per request:
  overview, timeseries, breakdown, live, visitors) and
  `live-visitors-action.ts` (the Online poller).
- `utils/`: `analytics-params.ts` (`?range=` plus one param per breakdown
  card: `sources`, `pages`, `locations`, `devices`), `format`, `labels`,
  `chart-axis`, `greeting-text`, `highlights`, `visitor-name`.
- `components/`: `analytics-sections.tsx` (async server sections that
  fetch), `section-boundary.tsx` (`SectionBoundary`: one `catchError` boundary with retry plus
  one `Suspense` per section), `analytics-toolbar`, `empty-state`,
  `skeletons`, and by page area: `overview/` (overview-card, kpi-strip,
  live-count, count-up, delta-chip, metric-hint, visitors-chart),
  `breakdowns/` (fixed-height tabbed card, rows, "Details" dialog, row
  icons), `visitors/` (recent visitors with DiceBear faces and nicknames),
  `summary/` (greeting, highlights).

Range and tabs live in the URL, so views are shareable and server-rendered;
tabs are plain links. Breakdown keys and visitor fields are tracker input:
render as text only. Row icons (referrer, browser, os, device, country):
`components/ui/icon.tsx`, static SVGs in `public/icons/`. Faces: `lib/avatar.ts` (server only). Site favicons:
`features/sites/components/site-favicon.tsx`. Metric definitions:
`docs/metrics.md`; design: `docs/design/dashboard.md`; queries: the
`stats-queries` skill.

Local data: `bun run db:seed -- --site <id> --events 20000 [--days 30]
[--seed 1]` writes deterministic, realistic pageviews for a site that exists
in the local database (sources, countries, devices, pages, daily and weekly
patterns, bounces, returning visitors). Local only; it adds, never deletes.

## Conventions in the code today

- **Server components by default.** `"use client"` only for state/effects/
  events (`features/auth/components/*`, `components/layout/account-menu.tsx`).
- **Auth**: everything under `app/(dashboard)/` is behind the layout's
  `getSession()` check. Pages may call `getSession()` again; React `cache`
  dedupes it per request.
- **Data**: `/api/v1` calls go through `apiRequest` in `lib/api-client.ts`
  (server only: forwards the cookie, times out, validates the response with
  a `packages/contracts` schema, redirects to sign-in on 401). Wrap it in a
  `features/<area>/server/<area>.queries.ts` function; components and pages never
  call `fetch`. Mutations from client components call a `"use server"`
  action that re-validates its input and calls a queries function (see
  `features/onboarding/server/add-site-action.ts`). `lib/session.ts` holds
  the only direct `fetch`es, for Better Auth. Never put the Worker URL in client code.
- **Routes**: add paths to `lib/routes.ts`, link with `routes.x`. Pages get
  `searchParams` through the generated `PageProps<"/path">` type
  (`next typegen` runs in `bun run typecheck`).
- **Errors to users**: map codes to copy in one place, like
  `lib/auth-errors.ts`. API errors are `{ error: { code, message } }`.
- **Styling**: Tailwind utilities inline. New code uses the tokens
  (`bg-background`, `text-muted-foreground`, `border-border`, `bg-muted`,
  `chart-1/2`); older pages still use the neutral palette they map to
  (`neutral-950`, `neutral-500`, `white`), `rounded-full` pill buttons, light `font-normal`
  headings with `tracking-tight`, `max-w-6xl px-6` page width. Variants as a
  `const VARIANTS = {...}` map (see `features/auth/components/auth-button.tsx`).
- **Dark mode**: `ThemeProvider` (next-themes, `class`, press `d`), the
  header toggle and /settings Appearance; tokens cover both themes.
- **Components**: one component per file, named export, props type above
  it, small private helpers (icons) at the bottom of the same file.
- **Accessibility**: labelled inputs (`sr-only` labels), `role="alert"` for
  errors, `aria-hidden` on decorative SVGs.

## Decisions to ask the user about (don't pick silently)

- New shadcn components: add with `bunx shadcn@latest add <name> -c apps/web`,
  then check the diff: the CLI once installed an unrelated npm package
  called `cn` when the utils alias didn't resolve.

## Tests

`apps/web/tests/` mirrors the source (`tests/features/settings/components/…`): render,
drive with `userEvent`, assert by role and label. Mock `@/lib/auth-client`
with `vi.hoisted` + `vi.mock`, as in `tests/features/auth/components/sign-in.test.tsx`.
`tests/setup.ts` mocks `@/lib/avatar` (server only) globally. Server components that call `getSession()` need
`@/lib/session` mocked.
