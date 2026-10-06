---
name: ingest-pipeline
description: Rules and design for Viewtally's public collect endpoint that receives pageviews from the tracking script, covering speed, input validation, origin check against the site's domain, the site cache, one batched D1 write, untrusted referrer/UTM handling, source classification, user-agent parsing and bot filtering. Use when building or changing the collect/ingest route, event parsing, source classification or bot detection in apps/api.
---

# Ingest pipeline

## Where it lives

```
apps/api/src/api/v1/ingest/
  ingest.routes.ts     POST /api/v1/collect: corsPublic, body cap, parse, log drops
  ingest.service.ts    drop checks, derived fields, db.batch
  site-cache.ts        findSite: per-isolate cache in front of the sites read
  ingest.schema.ts     body, derived value and path caps
  bot-filter.ts        isBot(userAgent): substring list
  user-agent.ts        parseUserAgent: ua-parser-js 1.x (MIT; 2.x is AGPL) → slugs
  referrer-source.ts   isSiteHost, referrerHost, classifySource (map in @workspace/contracts)
packages/contracts/src/ingest.ts   collectPayloadSchema, CollectPayload
apps/api/test/ingest.test.ts       end-to-end against in-memory D1
```

The route is mounted at `/collect` in `apps/api/src/api/v1/index.ts`, so
`corsPublic` (any origin, no credentials) applies to it only. No
`requireUser`/`requireSite`: the endpoint is public and never reads the
session.

## Per request, in order

1. **Size cap.** `bodyLimit` at 4 KB → 413.
2. **Parse.** Body is `text/plain` JSON (no preflight), so
   `JSON.parse(await c.req.text())`; not JSON → 400 `Body must be JSON`.
   Validate with `collectPayloadSchema` via `parseOrThrow` → 400 naming the
   field. URL and referrer ≤ 2048, ids are UUIDs, `name` is `pageview`.
3. **Drop checks** (service, cheapest first): missing/empty or bot
   User-Agent → `bot`; no parsable `Origin` (including `null`) →
   `missing_origin`; site id not found → `unknown_site`; Origin hostname
   not exactly `site.domain` or `www.<domain>` → `origin_mismatch`.
4. **Site lookup** goes through a per-isolate `Map` cache keyed by site id
   (60 s TTL, 1000 entries, oldest evicted, unknown ids cached too).
   Correctness never depends on it; a miss costs one D1 read.
5. **Derive server-side** (never from the client): `path` = URL pathname
   capped at 1024 (percent-encoding can make it longer than the URL);
   `utm_source/medium/campaign` from the URL; referrer hostname (own
   domain or `www.` → none); `source`; `country` from `request.cf.country`
   (`/^[A-Z]{2}$/` only); `region` and `city`, which Cloudflare derives from
   the IP, from `request.cf` (strings only, capped at 100, stored on events
   only; the IP itself is never stored); browser/os/device from User-Agent. Derived
   strings have control characters stripped, are trimmed and capped at 256.
6. **One `db.batch`**: insert visitor `ON CONFLICT (site_id, visitor_id)
DO NOTHING` (first touch is never overwritten), insert event (with
   `sessionId`), and only when `newSession` is true, update the visitor's
   `lastSeenAt` where it is older than now (so a first visit isn't written
   twice). Two or three rows written per event. A failed batch is rethrown
   with only D1's cause: Drizzle's message contains the bound values, which
   must not reach the logs.
7. **202, empty body**, awaited (no `waitUntil`).

Dropped events also get 202 plus a `console.log` with `reason`, `siteId`
and `rayId`, so the endpoint can't be used to probe which site ids or
domains exist, and customers' consoles stay clean. Only malformed bodies
get a 4xx.

## Never trust tracker input

Referrer, UTM, path and URL are attacker-controlled; anyone can POST
anything with any Origin from outside a browser. The origin check only
keeps honest browsers on other sites out.

- Store as plain text after the caps above. `source` for an unknown
  referrer is its hostname as parsed by `URL`.
- The dashboard renders all of these as React text nodes. No
  `dangerouslySetInnerHTML`, no building URLs for `href` without checking
  the scheme is `http:` or `https:`.

Details on bots and the source table:
[references/bots-and-sources.md](references/bots-and-sources.md).

## Not built yet

Custom events and props, `identify` (must only set
`visitors.externalUserId` when it is null), rate limiting per site or IP,
sampling of drop logs.

## Tests

`apps/api/test/ingest.test.ts` (route + D1), `user-agent.test.ts` (real UA
fixtures and bot list), `referrer-source.test.ts` (source table),
`packages/contracts/test/ingest.test.ts` (payload schema). Each ingest test
creates its own site, so the site cache never hides a change.
