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
  app/(dashboard)/sites/[siteId] site page (placeholder until stats exist)
  components/<area>/*.tsx        auth/, brand/, dashboard/ (+ theme-provider.tsx)
  features/<area>/               sites/ (*.queries.ts), onboarding/ (form, action, snippet)
  lib/                           api-client, auth-client, auth-errors, env, routes, session, snippets
  tests/                         Vitest + Testing Library (jsdom)
packages/ui/src/styles/globals.css   Tailwind import + @source globs only
```

Not there yet: shadcn components (`packages/ui/src/components` is empty),
the `cn` helper that `components.json` and `.prettierrc` expect at
`@workspace/ui/lib/utils`, design tokens (no CSS variables in
`globals.css`), icons (`lucide` is configured but not installed), a chart
library, and client-side data fetching (mutations go through server actions).

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
- **Styling**: Tailwind utilities inline. Neutral palette (`neutral-950`,
  `neutral-500`, `white`), `rounded-full` pill buttons, light `font-normal`
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

- Chart library (none installed). Analytics charts are core, so this is a
  product decision.
- Adopting shadcn: needs `packages/ui/src/lib/utils.ts` (`cn` with `clsx` +
  `tailwind-merge`) and CSS-variable tokens in `globals.css`. Add components
  with `bunx shadcn@latest add <name> -c apps/web` (the README
  says `pnpm dlx`, but this repo uses bun).
- Dark mode for the dashboard.

## Tests

`apps/web/tests/*.test.tsx`: render, drive with `userEvent`, assert by role
and label. Mock `@/lib/auth-client` with `vi.hoisted` + `vi.mock`, as in
`tests/sign-in.test.tsx`. Server components that call `getSession()` need
`@/lib/session` mocked.
