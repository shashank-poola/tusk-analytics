---
paths:
  - "packages/db/**"
---

# Database (packages/db, Cloudflare D1 via Drizzle)

- Change `src/schema/*.ts`, then `bun run db:generate`. Never hand-edit
  `migrations/meta/*` or a committed `migrations/*.sql` (a hook blocks it).
- Migrations must work with the Worker version that is already deployed: add
  nullable columns or columns with a default, add tables and indexes. No
  drops, renames or type changes in the same release as the code change.
  `bun run check:migrations` enforces this.
- D1 rejects `BEGIN`/`COMMIT`. Group writes with `db.batch([...])`, which runs
  them atomically.
- Every index is written on every insert. `events` and `visitors` are the hot
  tables: justify any new index on them by a query that needs it.
- Limits: 100 bound parameters per query (chunk multi-row inserts), 100 KB
  per statement, 30 s per query, single-threaded per database.
- High-volume tables have no foreign keys on purpose; delete their rows in
  batches.
- Timestamps are unix ms via `timestamp()`/`createdAt()` in
  `src/schema/columns.ts`. Money is integer minor units; `amountUsd` is summed.
- Export new tables and types from `src/schema/index.ts`; apps import only
  from `@workspace/db`.
- Skill: `d1-migration`. Review with the `d1-schema-reviewer` agent.
