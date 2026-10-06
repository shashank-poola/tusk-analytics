---
name: stats-queries
description: How Viewtally computes dashboard metrics (visitors, pageviews, sessions, bounce rate, timeseries, breakdowns) from the events table, and how to add a new metric or breakdown dimension safely. Use when changing packages/db/src/queries/stats.ts, the stats API module in apps/api/src/api/v1/stats/, or docs/metrics.md, or when adding a chart, total or breakdown to the dashboard.
---

# Stats queries

## Where things live

```
docs/metrics.md                          definitions: the source of truth
packages/db/src/queries/stats.ts         getTotals, getTimeseries, getBreakdown
apps/api/src/api/v1/stats/stats.range.ts ranges, previous period, UTC offset
apps/api/src/api/v1/stats/stats.service  zero-fill, bounce rate, response shape
packages/contracts/src/stats.ts          StatsRange, BreakdownBy, responses
apps/web/features/analytics/             queries, cards, chart, breakdown
apps/api/test/stats.test.ts              hand-computed fixtures per rule
```

## Rules

1. **Definitions first.** Change `docs/metrics.md`, then the code. Code
   comments link to it instead of restating definitions.
2. **Only pageviews.** Every query filters `name = 'pageview'` through
   `pageviewsInRange`.
3. **Site scoping and the index.** Every query reads one site's events in
   `[fromMs, toMs)` through `events_site_time_idx (site_id, created_at)`.
   Callers pass a site from `requireSite`; the queries never check
   ownership themselves.
4. **Per-session attribution.** Source, country, device, browser and OS
   count each session once, under its first pageview in the range. Use a
   grouped query or CTE (the `min()` bare-column rule, see the comment in
   `getBreakdown`) or a window function, never a correlated subquery per
   row. Pages count per event.
5. **Fixed dimension map.** A breakdown picks a key of `SESSION_DIMENSIONS`
   (or `page`). Request input selects a key, never a column name, and no
   value is interpolated into SQL: use drizzle's `sql` template so values
   are bound.
6. **Real distinct counts per bucket.** Visitors per hour or day come from
   `count(DISTINCT visitor_id)` in that bucket, never a sum of smaller
   buckets. The service zero-fills buckets without rows.
7. **Time zones.** The service computes the site's UTC offset with `Intl`
   at the range end and passes it to SQL in ms. Bucket timestamps carry that
   offset (`…T00:00:00.000+05:30`) so the dashboard never converts zones.
8. **`now` is a parameter** of every service function, so tests pin it.

## Adding a breakdown dimension

1. Add the value to `breakdownBySchema` in `packages/contracts/src/stats.ts`.
2. Add `key: events.<column>` to `SESSION_DIMENSIONS` (typecheck fails in
   the service until both lists agree).
3. Add a tab in `features/analytics/breakdown-tabs.tsx` and a column label
   in `COLUMN_LABELS` in `breakdown-table.tsx`.
4. Extend the `it.each` dimension test in `apps/api/test/stats.test.ts`.

## Adding a metric

1. Define it in `docs/metrics.md`.
2. Compute it in an existing query if it reads the same rows; a new query
   needs its `EXPLAIN QUERY PLAN` to show
   `SEARCH events USING INDEX events_site_time_idx`.
3. Add the field to the response schema in contracts (additive only), then
   a hand-computed fixture test.

## Checking performance

Seed locally (`bun run db:seed -- --site <id> --events 100000 --days 90`)
and compare `meta.rows_read` from the D1 binding: about 2 rows per pageview
in range (index entry + row) is the floor without a covering index. No new
index without showing its plan and its write cost on `events`; see the
`d1-migration` skill. Rollups or caching come later (`docs/metrics.md`).
