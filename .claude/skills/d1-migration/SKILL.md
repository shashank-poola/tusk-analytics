---
name: d1-migration
description: Changes the Drizzle schema in packages/db, generates a D1 migration, reviews the SQL for backward compatibility and write cost, and applies it to the local database only. Use when adding or changing a table, column or index, or when a task needs new data stored in D1.
---

# D1 migration

Production migrations run only in `.github/workflows/deploy.yml`, before the
new Worker is deployed. The old Worker serves traffic against the new schema
for a while, so every migration must be **additive and backward compatible**.

## Steps

1. Edit `packages/db/src/schema/<area>.ts`. Reuse `timestamp()`,
   `createdAt()`, `updatedAt()` from `columns.ts` and `createId()` for text
   ids. Export new tables and types from `src/schema/index.ts`; add relations
   in `relations.ts` if you use `db.query.*.findMany({ with })`.
2. `bun run db:generate`. It writes `packages/db/migrations/NNNN_<name>.sql`
   and updates `meta/`. If it says "No schema changes", nothing needed SQL.
3. Read the SQL and go through the checklist below.
4. `bun run check:migrations`: CI runs the same check on every PR.
5. `bun run db:migrate` applies it to the local D1 in `.wrangler/state`.
   API tests apply all migrations to an in-memory D1 by themselves
   (`apps/api/test/apply-migrations.ts`).
6. `bun run test`, then ask the `d1-schema-reviewer` agent to review.

Hand-written SQL (data backfill, an index Drizzle can't express):
`bunx drizzle-kit generate --custom --name=<name>` inside `packages/db`,
then write the SQL into the new empty file.

## Checklist for the generated SQL

- Only `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE ... ADD COLUMN`.
- New columns are nullable or have a `DEFAULT`. SQLite rejects `ADD COLUMN`
  with `NOT NULL` and no default.
- No `DROP`, `RENAME`, or Drizzle's table rebuild (`__new_<table>` +
  `INSERT INTO ... SELECT`). A rebuild of `events` or `visitors` rewrites
  every row and can exceed D1's 30 s query limit.
- No `BEGIN`/`COMMIT`/`SAVEPOINT`: D1 rejects them. Wrangler applies each
  migration file atomically and rolls it back if it fails.
- New index on a hot table (`events`, `visitors`, `payments`)? Every insert
  pays one extra row write for each index. Name the query that needs it.
- Never edit a committed migration or anything in `meta/`. A hook blocks it;
  write a new migration instead.

## Destructive changes

Renames, drops and type changes take two or three releases
(expand → migrate code → contract). See
[references/expand-contract.md](references/expand-contract.md). A contract
migration needs the marker `-- viewtally: allow-destructive <reason>` so
`check:migrations` lets it through, and a human must approve it.

## Writing code against D1

- Atomic multi-statement writes: `await db.batch([q1, q2])`. Drizzle's
  `db.transaction()` emits `BEGIN` and fails on D1.
- Multi-row inserts: at most 100 bound parameters per statement, so chunk
  rows (`Math.floor(100 / columnsPerRow)` rows per insert).
- Limits and cost details: [references/d1-limits.md](references/d1-limits.md).
