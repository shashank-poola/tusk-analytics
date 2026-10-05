---
name: ingest-pipeline
description: Rules and design for Viewtally's public collect endpoint that receives pageviews and custom events from the tracking script, covering speed, input validation, origin check against the site's domain, one batched D1 write, untrusted referrer/UTM handling and bot filtering. Use when building or changing the collect/ingest route, event parsing, source classification or bot detection in apps/api.
---

# Ingest pipeline

**Not built yet.** What exists: the `events` and `visitors` tables
(`packages/db/src/schema/tracking.ts`) and `corsPublic`
(`apps/api/src/middleware/cors-public.ts`). This skill is the intended
design; build it with the `add-api-module` layout as
`apps/api/src/api/v1/collect/`.

## Route

`POST /api/v1/collect`, mounted with `corsPublic` and **without**
`requireUser`/`requireSite`. The tracker sends `Content-Type: text/plain`
(no CORS preflight), so read `await c.req.text()` and `JSON.parse` it inside a
try/catch.

## Per request, in order

1. **Size cap.** Reject bodies over 8 KB (check `content-length`, then the
   text length) before parsing.
2. **Validate** with zod: site id (`vt_` + 16 chars of
   `0123456789abcdefghjkmnpqrstvwxyz`), event name ≤ 64, URL ≤ 2048,
   referrer ≤ 2048, visitor and session ids matching the tracker's format,
   `props` ≤ 10 keys of string/number/boolean with values ≤ 256 chars.
3. **Drop bots** before touching D1. See
   [references/bots-and-sources.md](references/bots-and-sources.md).
4. **Look up the site** by id. Cache `{ id, domain }` per isolate for ~60 s
   (a `Map` with expiry) so most events skip the read.
5. **Check origin.** The `Origin` header's hostname must equal `site.domain`
   or be a subdomain of it (`www.` and `app.` count; `evilmyapp.com` doesn't).
   On mismatch, or unknown site, still answer 202 and write nothing.
6. **Derive server-side fields**: `country` from `c.req.raw.cf?.country`,
   browser/os/device from `User-Agent`, `source` from referrer + UTM,
   `path` from the URL without query string or fragment.
7. **One batched write**: `db.batch([insert event, upsert visitor])`. The
   visitor upsert sets `first*` columns only on insert and updates only
   `lastSeenAt` on conflict (`onConflictDoUpdate` on `(siteId, visitorId)`).
8. **Respond 202 with an empty body** and do step 7 inside
   `c.executionCtx.waitUntil(...)`, so the page's beacon isn't held open by
   D1. Catch and `console.error` failures inside the `waitUntil` promise.

The answer is the same (202) for valid, invalid-origin, bot and unknown-site
requests, so the endpoint can't be used to probe which site ids exist.
Malformed bodies get 400.

## Never trust tracker input

Referrer, UTM, path and props are attacker-controlled; anyone can POST
anything.

- Store as plain text after length caps; strip control characters.
- `source` comes from a fixed mapping (hostname → channel); unknown
  referrers store the bare hostname only if it matches
  `^[a-z0-9.-]{1,253}$`, else `null`.
- The dashboard renders all of these as React text nodes. No
  `dangerouslySetInnerHTML`, no building URLs for `href` without checking
  the scheme is `http:` or `https:`.
- An `identify` event can set `visitors.externalUserId` only when it is
  null (first write wins), so a forged identify can't re-point an existing
  visitor's payments.

## Tests (apps/api/test/collect.test.ts)

Valid pageview → one `events` row, one `visitors` row; second pageview from
the same visitor → `first*` unchanged, `lastSeenAt` moves; wrong `Origin` →
202, no rows; bot user agent → 202, no rows; 9 KB body → 400; oversized
UTM → rejected or truncated as designed; `<script>` in UTM stored verbatim
as text. In tests, wait for `waitUntil` work before asserting (use
`createExecutionContext`/`waitOnExecutionContext` from `cloudflare:test`).
