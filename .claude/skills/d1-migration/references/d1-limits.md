# D1 limits and write cost

From developers.cloudflare.com/d1/platform/limits (checked 2026-10-05; check
again if it matters):

| Limit                         | Value                                  |
| ----------------------------- | -------------------------------------- |
| Database size                 | 10 GB (Workers Paid) / 500 MB (Free)   |
| Query duration                | 30 s                                   |
| Bound parameters per query    | 100                                    |
| SQL statement length          | 100 KB (each statement in a batch too) |
| Row / string / BLOB size      | 2 MB                                   |
| Queries per Worker invocation | 1000 (Paid) / 50 (Free)                |

Each database is single-threaded: it runs one query at a time. A 1 ms query
allows ~1000 queries/s; a 100 ms query allows 10/s. Slow dashboard queries
therefore slow down ingest. Keep hot-path queries on an index and short.

## Write cost

D1 bills rows read and rows written. Writing a row also writes one entry in
each of the table's indexes, so an index on `events` adds cost to every
pageview. Before adding an index, name the query that needs it and check
with `EXPLAIN QUERY PLAN` in `bun run db:studio` (local).

Current indexes on the hot path:

- `events`: `events_site_time_idx (site_id, created_at)`,
  `events_site_visitor_idx (site_id, visitor_id)`
- `visitors`: primary key `(site_id, visitor_id)`,
  `visitors_external_user_idx (site_id, external_user_id)`

## Batching

`db.batch([...])` sends several statements in one round trip and runs them
as one implicit transaction: all succeed or none do. Use it for "insert
event + upsert visitor" and for multi-table writes. Chunk large inserts to
stay under 100 bound parameters per statement:

```ts
const perRow = 5 // columns you insert
const size = Math.floor(100 / perRow)
const statements = []
for (let i = 0; i < rows.length; i += size) {
  statements.push(db.insert(table).values(rows.slice(i, i + size)))
}
const [first, ...rest] = statements
if (first) await db.batch([first, ...rest])
```

## Deleting a site's data

`events` and `visitors` have no FK cascade. Delete in chunks by
primary-key range, 1000 rows per statement, from a Queue consumer or cron, not in a request.
