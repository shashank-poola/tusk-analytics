# Metrics

The single source of truth for what the dashboard counts. Code that computes
a metric links here; change this file first when a definition changes.

Queries: `packages/db/src/queries/stats.ts` (totals, timeseries, online),
`stats-breakdown.ts`, `stats-visitors.ts` and `channels.ts` next to it.
Ranges and buckets: `apps/api/src/api/v1/stats/stats.range.ts`.

## What is counted

Only events with `name = 'pageview'`. Custom events (not built yet) never
count towards these metrics.

| Metric       | Definition                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Pageviews    | Number of pageview events.                                                                                                 |
| Visitors     | Distinct `visitor_id`.                                                                                                     |
| Sessions     | Distinct `session_id`.                                                                                                     |
| Bounce rate  | Sessions with exactly one pageview ÷ sessions. 0 with no sessions.                                                         |
| Session time | Mean over sessions of (last pageview's `created_at` − first pageview's), in seconds. A one-pageview session counts as 0 s. |
| Online       | Distinct `visitor_id` with a pageview in the last 5 minutes (`now − 5 min <= created_at < now`), whatever the range.       |

Every metric except online is computed over events with `range.from <=
created_at < range.to`. A session that started before the range counts only
with its events inside the range, so its session time is the part inside the
range.

Session time measures from the first to the last pageview: the time spent on
the last page is unknown (there is no leave event), which is why a bounce
counts as 0 s. It is `avgSessionSeconds` in the overview response and isn't
rounded.

## Attribution

**Per session** for source, channel, referrer, campaign, entry page,
country, region, city, device, browser and OS: a session counts once, under
the values of its first pageview inside the range (earliest `created_at`; if
two share the same millisecond, either one). A visit that arrived from google and then
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

### Dimensions

| Dimension    | Value                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `source`     | `events.source`: lowercased `utm_source`, else the referrer's known name (`google`, `x`), else its hostname, else `direct`. |
| `channel`    | The source grouped into a channel, see below.                                                                               |
| `referrer`   | `events.referrer`: the referrer's hostname, `null` for none (direct, or navigation inside the site).                        |
| `campaign`   | `events.utm_campaign`, as tagged.                                                                                           |
| `page`       | Per event: the pageview's `path`.                                                                                           |
| `entry_page` | The `path` of the session's first pageview in the range.                                                                    |
| `exit_page`  | The `path` of the session's **last** pageview in the range (latest `created_at`; ties: either one).                         |
| `country`    | ISO 3166-1 alpha-2 from Cloudflare's `request.cf.country`.                                                                  |
| `region`     | `request.cf.region` (state, province), grouped with its country: rows carry `country`.                                      |
| `city`       | `request.cf.city`, grouped with its country, so Paris, FR and Paris, US are two rows.                                       |
| `device`     | `desktop`, `mobile` or `tablet`, from the User-Agent.                                                                       |
| `browser`    | Browser family from the User-Agent.                                                                                         |
| `os`         | Operating system from the User-Agent.                                                                                       |

Region and city are derived by Cloudflare from the visitor's IP at ingest
(`request.cf.region`, `request.cf.city`) and stored on the event only (not
on `visitors`); the IP itself is never stored. Events from before they were
collected have `null`. Unknown regions or cities form one row with `key` and
`country` both `null`, whatever the visitors' countries.

### Channels

Computed at query time from the session's first pageview's `source` and
`utm_medium` (compared lowercased). The first rule that matches wins. The
value lists live in `packages/db/src/queries/channels.ts`; change them there.

| Channel    | Rule                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| `paid`     | `utm_medium` is a paid medium: `cpc`, `ppc`, `cpm`, `cpv`, `paid`, `paidsearch`, `paid_social`, `display`, ...  |
| `email`    | `utm_medium` or `source` is `email`, `e-mail` or `newsletter`.                                                  |
| `direct`   | `source` is `direct` or missing.                                                                                |
| `search`   | `source` is a search engine: `google`, `bing`, `duckduckgo`, `yahoo`, `ecosia`, `brave`, `baidu`, `yandex`.     |
| `social`   | `source` is a social or community site: `x`, `facebook`, `linkedin`, `reddit`, `hackernews`, `producthunt`, ... |
| `ai`       | `source` is an AI assistant: `chatgpt`, `perplexity`, `claude`, `gemini`, `copilot`.                            |
| `referral` | Anything else: other sites by hostname, `github`, and untagged `utm_source` values.                             |

Hacker News and Product Hunt are `social` (people discussing a launch);
GitHub is `referral` (a link from a README or repo behaves like a site
linking to you). A paid campaign stays `paid` whatever its source.

## Visitors list

The most recent visitors in the range, latest first, up to `limit` (20 by
default, at most 50). For each `visitor_id` with a pageview in the range:

- `id`: a site-scoped pseudonym, never the tracker's `visitor_id` (the
  `vt_vid` cookie value). It is HMAC-SHA256 keyed with `BETTER_AUTH_SECRET`
  over `viewtally:visitor-pseudonym:v1:<siteId>:<visitorId>`, in hex, cut
  to 24 characters. Stable across requests, different for the same browser
  on two sites; rotating the secret changes every pseudonym (avatars,
  nicknames).
- `source`, `country`, `region`, `city`, `device`, `browser`, `os`: from
  the visitor's first pageview in the range (not their all-time first touch).
- `pageviews` and `sessions` (distinct `session_id`) in the range.
- `firstSeenAt` / `lastSeenAt`: their first and latest pageview in the range.
- `lastPage`: the `path` of their latest pageview in the range.

Region and city here are the same Cloudflare IP-derived values as in the
breakdowns; the IP is not stored.

Ties on `lastSeenAt` are ordered by `visitor_id`.

## Ranges

Every stats request names a **period**. Window math lives in
`packages/contracts/src/stats-period.ts`, shared by the API and the
dashboard so labels and queries agree.

| `range`  | Covers (at `offset` 0)                               | Default interval |
| -------- | ---------------------------------------------------- | ---------------- |
| `today`  | Today from local midnight, until now                 | Hourly           |
| `24h`    | The current hour and the 23 before it, until now     | Hourly           |
| `7d`     | Today and the 6 days before it, from local midnight  | Daily            |
| `30d`    | Today and the 29 days before it, from local midnight | Daily            |
| `90d`    | Today and the 89 days before it, from local midnight | Daily            |
| `12mo`   | This month and the 11 before it, from the local 1st  | Monthly          |
| `custom` | `from` 00:00 to the end of `to` (local dates)        | see below        |

- A preset with `offset=n` is the same preset `n` whole periods earlier:
  `7d&offset=1` is the 7 full days before the last 7, `today&offset=1` is
  yesterday. Offsets run from 0 to 1000.
- A custom period is at most 366 days, `from <= to`. Its default interval is
  hourly up to 2 days, daily up to 92, monthly beyond.
- A period ends at **now** at the latest, so a running period's last bucket
  is partial (`inProgress: true` on the timeseries).
- Hours and days are the site's local hours and days (`sites.timezone`).
- **Previous period**: the same length immediately before the period
  (`previousTo = from`, `previousFrom = from - (to - from)`). For `7d` at
  10:00 on a Wednesday that compares Thursday 00:00 → Wednesday 10:00 with
  the 6 days and 10 hours before it.

### Intervals

`interval` is `hour`, `day`, `week` or `month`. Weeks start on Monday,
months on the 1st, both local. Hourly buckets are only allowed for periods
of up to 31 days (a 400 otherwise). The timeseries has one point per bucket
of the period at its full length, including the running one and buckets with
no events (zero-filled); the first week or month may start before the
period. Visitors per bucket are distinct visitors in that bucket, so daily
visitors are not the sum of hourly visitors.

A point's `t` is the bucket's start as an ISO string with the site's UTC
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

- Periods are capped at 366 days (`12mo`, custom), breakdowns at 50 rows (default 10) and the
  visitors list at 50 (default 20). These caps are the protection for now:
  every request reads the raw events of its range through
  `events_site_time_idx (site_id, created_at)`. Totals read the range twice
  (once for the per-session bounce and session-time subquery). The visitors
  list also reads it twice: a full pass grouped and sorted by visitor (a temp
  B-tree, since the index doesn't cover `visitor_id`) to pick the latest
  `limit` visitors, then a second pass over the range that keeps only those
  visitors' pageviews.
- A `12mo` or long custom period reads up to a year of raw events per
  request; fine for small sites, the first thing rollups should cover.
- Retention: none enforced yet for events (open decision).
- No caching or rollups yet. When raw scans get too slow, add daily rollup
  tables or a short-lived cache in front of these queries; the definitions
  above stay the same.
