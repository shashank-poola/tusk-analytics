# Metrics

The single source of truth for what the dashboard counts. Code that computes
a metric links here; change this file first when a definition changes.

Queries: `packages/db/src/queries/stats.ts`. Ranges and buckets:
`apps/api/src/api/v1/stats/stats.range.ts`.

## What is counted

Only events with `name = 'pageview'`. Custom events (not built yet) never
count towards these metrics.

| Metric      | Definition                                                         |
| ----------- | ------------------------------------------------------------------ |
| Pageviews   | Number of pageview events.                                         |
| Visitors    | Distinct `visitor_id`.                                             |
| Sessions    | Distinct `session_id`.                                             |
| Bounce rate | Sessions with exactly one pageview ÷ sessions. 0 with no sessions. |

Every metric is computed over events with `range.from <= created_at <
range.to`. A session that started before the range counts only with its
events inside the range.

## Attribution

**Per session** for source, country, device, browser and OS: a session counts
once, under the values of its first pageview inside the range (earliest
`created_at`; if two share the same millisecond, either one). A visit that arrived from google and then
browsed three internal pages counts once under `google`, never under
`direct`, even though ingest stores `direct` on the internal pageviews. Its
visitor counts under `google`, and all four pageviews count towards
`google`'s pageviews.

A visitor with sessions from two sources counts once under each, so the
visitor column of a breakdown can add up to more than the visitor total.

**Per event** for pages: each pageview counts under its own `path`, with the
distinct visitors who viewed that path.

Missing values (no country, an unknown browser) are grouped under a `null`
key, which the dashboard shows as "Unknown".

## Ranges

| Range | Covers                                               | Buckets |
| ----- | ---------------------------------------------------- | ------- |
| `24h` | The current hour and the 23 before it, until now     | Hourly  |
| `7d`  | Today and the 6 days before it, from local midnight  | Daily   |
| `30d` | Today and the 29 days before it, from local midnight | Daily   |
| `90d` | Today and the 89 days before it, from local midnight | Daily   |

- Every range ends at **now**, so today is a partial day.
- Hours and days are the site's local hours and days (`sites.timezone`).
- **Previous period**: the same length immediately before the range
  (`previousTo = from`, `previousFrom = from - (to - from)`). For `7d` at
  10:00 on a Wednesday that compares Thursday 00:00 → Wednesday 10:00 with
  the 6 days and 10 hours before it.
- The timeseries has one point per bucket, including buckets with no events
  (zero-filled). Visitors per bucket are distinct visitors in that bucket, so
  daily visitors are not the sum of hourly visitors.
- A point's `t` is the bucket's start as an ISO string with the site's UTC
  offset, e.g. `2026-10-06T00:00:00.000+05:30`, so the dashboard can label it
  without converting time zones.

### Time zones and DST

SQLite has no IANA time zone support. The API computes the site's UTC offset
with `Intl` **at the end of the range** and passes it to SQL in minutes; the
whole range uses that one offset.

Limitation: when a range crosses a daylight-saving change, the days before
the change are shifted by the DST difference (usually one hour). For a site
in `Europe/Berlin` viewed in summer, a winter day runs from 23:00 to 23:00
local winter time. Totals are unaffected; only the split between adjacent
buckets near midnight is. Fixing it needs per-bucket offsets, which can come
with rollups.

## Limits and performance

- Ranges are capped at 90 days and breakdowns at 50 rows (default 10). These
  caps are the protection for now: every request reads the raw events of its
  range through `events_site_time_idx (site_id, created_at)`.
- No caching or rollups yet. When raw scans get too slow, add daily rollup
  tables or a short-lived cache in front of these queries; the definitions
  above stay the same.
