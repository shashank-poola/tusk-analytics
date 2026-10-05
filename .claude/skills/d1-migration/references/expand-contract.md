# Expand / contract on D1

The deploy order is: migrations → API Worker → web. Between steps 1 and 2
the **old** Worker runs against the **new** schema, and after a rollback
(`wrangler rollback`) an old Worker can run against it for days. So each
release's migration must work with the previous release's code.

## Rename a column (`sites.domain` → `sites.hostname`)

1. Release A (expand): add `hostname` (nullable). Code writes both columns,
   reads `coalesce(hostname, domain)`. Custom migration backfills:
   `UPDATE sites SET hostname = domain WHERE hostname IS NULL;`
   On large tables, backfill in chunks by primary key range from a script or
   cron, not in the migration (30 s query limit).
2. Release B: code reads and writes only `hostname`.
3. Release C (contract): drop `domain` with the
   `-- viewtally: allow-destructive <reason>` marker, after B has been live
   long enough that you'd never roll back to A.

## Drop a column or table

Stop reading and writing it in release A. Drop it in a later release with
the marker. Dropping a column that the deployed Worker still selects breaks
every request that touches the table.

## Make a column NOT NULL / change its type

SQLite can't alter a column in place; Drizzle generates a table rebuild
(`CREATE TABLE __new_x`, copy, `DROP`, `RENAME`). Instead: add a new column
with the right type and a default, backfill, switch code, drop the old
column later. Accept a rebuild only on small tables (`sites`,
`integrations`), and only with the marker.

## Change a unique index

Create the new index first (it fails if existing rows violate it, so
de-duplicate in an earlier release), switch code, then drop the old index.

## Foreign keys

High-volume tables (`events`, `visitors`) have no foreign keys on purpose.
When a migration has to violate an FK temporarily, start it with
`PRAGMA defer_foreign_keys = true;` (Cloudflare's documented approach).
