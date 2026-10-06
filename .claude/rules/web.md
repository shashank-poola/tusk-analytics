---
paths:
  - "apps/web/**"
  - "packages/ui/**"
---

# Dashboard (apps/web)

- Next.js 16 with breaking changes: read `node_modules/next/dist/docs/` for
  any API you are unsure of (see the managed block in AGENTS.md).
- Server components by default. Add `"use client"` only for state, effects or
  event handlers, as in `features/auth/components/*`.
- The browser calls only this origin. Server code calls `/api/v1` through
  `apiRequest` (`lib/api-client.ts`) from a `*.queries.ts` file; client
  components mutate through server actions. Never call the Worker URL from
  client code.
- Layout: `app/` is routes only; feature code in `features/<feature>/`
  (`components/`, `server/`, `hooks/`, `utils/`); shared UI in
  `components/` (`ui/`, `layout/`, `brand/`, `providers/`). Tests mirror the
  source tree under `tests/`.
- Route paths live in `lib/routes.ts`; pages read `searchParams` through the
  generated `PageProps<"/path">` type.
- Pages in `app/(dashboard)/` are already behind the session check in the
  group layout.
- Tests: Vitest + Testing Library in `apps/web/tests/`, mocking
  `@/lib/auth-client` with `vi.hoisted` + `vi.mock`.
- Skill: `dashboard-ui`.
