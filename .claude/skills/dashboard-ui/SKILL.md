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
  app/layout.tsx                 fonts (Geist → --font-sans/--font-mono), ThemeProvider
  app/page.tsx                   redirects to /dashboard
  app/signup/page.tsx            sign-in page (AuthShowcase + SignIn)
  app/(dashboard)/layout.tsx     session gate → redirect(routes.signIn); header
  app/(dashboard)/dashboard/     redirects to the newest site or /onboarding
  app/(dashboard)/onboarding/    add a site; [siteId]/ shows the install snippet
  app/(dashboard)/sites/[siteId]/ layout: site switcher + range picker; page: analytics
  components/<area>/*.tsx        auth/, brand/, dashboard/ (+ theme-provider.tsx)
  features/<area>/               analytics/ (stats), sites/ (queries, switcher), onboarding/
  lib/                           api-client, auth-client, auth-errors, env, routes, session, snippets
  tests/                         Vitest + Testing Library (jsdom)
packages/ui/src/
  styles/globals.css             Tailwind, design tokens (:root vars + @theme inline)
  lib/utils.ts                   cn (clsx + tailwind-merge)
  components/chart.tsx           shadcn chart (recharts)
```

Not there yet: icons (`lucide` is configured but not installed), dark mode
tokens, and client-side data fetching (mutations go through server actions).

## Analytics page

`features/analytics/`: `analytics.queries.ts` (stats API, `cache`d per
request), `analytics-params.ts` (`?range=` and `?tab=`, default `7d` and
`source`), `analytics-sections.tsx` (async server sections that fetch),
`analytics-section.tsx` (one `catchError` boundary with retry plus one
`Suspense` per section), and presentational `stat-cards`, `visitors-chart`
(client), `breakdown-table`, `breakdown-tabs`, `date-range-picker` (client).
Range and tab live in the URL, so views are shareable and server-rendered;
tabs are plain links. Breakdown keys are tracker input: render as text only.
Metric definitions: `docs/metrics.md`; queries: the `stats-queries` skill.

Local data: `bun run db:seed -- --site <id> --events 20000 [--days 30]
[--seed 1]` writes deterministic, realistic pageviews for a site that exists
in the local database (sources, countries, devices, pages, daily and weekly
patterns, bounces, returning visitors). Local only; it adds, never deletes.

## Conventions in the code today

- **Server components by default.** `"use client"` only for state/effects/
  events (`components/auth/*`, `sign-out-button.tsx`).
- **Auth**: everything under `app/(dashboard)/` is behind the layout's
  `getSession()` check. Pages may call `getSession()` again; React `cache`
  dedupes it per request.
- **Data**: `/api/v1` calls go through `apiRequest` in `lib/api-client.ts`
  (server only: forwards the cookie, times out, validates the response with
  a `packages/contracts` schema, redirects to sign-in on 401). Wrap it in a
  `features/<area>/<area>.queries.ts` function; components and pages never
  call `fetch`. Mutations from client components call a `"use server"`
  action that re-validates its input and calls a queries function (see
  `features/onboarding/add-site-action.ts`). `lib/session.ts` is the one
  direct `fetch`, for Better Auth. Never put the Worker URL in client code.
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
  `const VARIANTS = {...}` map (see `components/auth/auth-button.tsx`).
- **Dark mode** is half-wired: `ThemeProvider` (next-themes, `class`, press
  `d` to toggle) is mounted, but the dashboard layout hardcodes
  `bg-white text-neutral-950` and there are no `dark:` styles yet.
- **Components**: one component per file, named export, props type above
  it, small private helpers (icons) at the bottom of the same file.
- **Accessibility**: labelled inputs (`sr-only` labels), `role="alert"` for
  errors, `aria-hidden` on decorative SVGs.

## Decisions to ask the user about (don't pick silently)

- Dark mode for the dashboard.
- New shadcn components: add with `bunx shadcn@latest add <name> -c apps/web`,
  then check the diff: the CLI once installed an unrelated npm package
  called `cn` when the utils alias didn't resolve.

## Tests

`apps/web/tests/*.test.tsx`: render, drive with `userEvent`, assert by role
and label. Mock `@/lib/auth-client` with `vi.hoisted` + `vi.mock`, as in
`tests/sign-in.test.tsx`. Server components that call `getSession()` need
`@/lib/session` mocked.
