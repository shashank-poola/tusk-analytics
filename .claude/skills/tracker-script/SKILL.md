---
name: tracker-script
description: Builds and changes packages/tracker, the browser script customers embed, within a 2 KB gzip budget with zero dependencies, covering SPA route changes, the first-party visitor and session cookies, privacy rules, the payload it sends to the collect endpoint, plus how to build, size-check and test it by hand. Use when creating or editing the tracking snippet or anything it sends to the collect endpoint.
---

# Tracker script

## Layout

```
packages/tracker/
  src/index.ts       entry: reads config, sends pageviews, never throws
  src/config.ts      data-* attributes, localhost and opt-out skips
  src/cookie.ts      read/write first-party id cookies (try/catch)
  src/visitor.ts     vt_vid visitor id
  src/session.ts     vt_sid session id, rolling 30 minutes; a load from
                     another site or a tagged link starts a new one
  src/send.ts        sendBeacon, fetch keepalive fallback
  src/spa.ts         pushState/replaceState/popstate hook
  src/outbound.ts    clicks on links to other sites (origin + path only)
  src/goals.ts       window.viewtally("goal"), its pre-load queue, data-vt-goal
  build.ts           Bun.build → apps/api/public/script.js (gitignored)
  test/*.test.ts     Vitest + jsdom (helpers.ts loads a fresh instance)
  test-page/         index.html + serve.ts for manual testing
```

`src/` imports nothing outside itself except `import type` from
`@workspace/contracts`, so zod never reaches the bundle.

## Build and serve

- `bun run build` (turbo) runs `build.ts`: minified IIFE written to
  `apps/api/public/script.js`. The API Worker serves it as `/script.js`
  through Workers static assets (`assets` in `apps/api/wrangler.jsonc`);
  `apps/api/public/_headers` sets `Cache-Control: public, max-age=3600`
  because the URL can't be versioned.
- Wrangler's `build` hook runs the same build before `wrangler dev` and
  deploys, and rebuilds when `packages/tracker/src` changes in dev.
- `bun run check:tracker-size` fails above 2048 bytes gzipped
  (`scripts/check-tracker-size.ts`, run in CI after the build). Today it
  is about 1.1 KB. If a change pushes it over, cut something; raise the
  budget only with the user's agreement.

## Behavior

- Config from `document.currentScript`: `data-site="vt_…"` (required; the
  install snippet's attribute, never rename it), `data-api` (an origin; the
  default is the script's own origin), `data-allow-localhost="true"`.
  Endpoint: `<origin>/api/v1/collect`.
- Skips entirely on `localhost`, `127.0.0.1` and `file:` (unless
  `data-allow-localhost="true"`), and when `localStorage.vt_ignore` is set
  to anything (owners exclude themselves).
- Pageview on load, then after `history.pushState`/`replaceState` and on
  `popstate`, only when path or query changed (hash-only and same-URL
  changes don't count, so a router's replaceState on load doesn't double
  count). Skipped while `document.visibilityState === "prerender"`.
- Transport: `navigator.sendBeacon` with a `text/plain` Blob (no CORS
  preflight); if it's missing, throws or returns false, `fetch` with
  `keepalive: true`, `credentials: "omit"` and the same body. Never retries.
- Every entry point and storage access is in try/catch. The script must
  never throw into the host page. With cookies blocked, ids live in memory
  for the page's lifetime.
- Not built yet: goal properties, `identify`.

## Payload

Type `CollectPayload` in `packages/contracts/src/ingest.ts`; the collect
endpoint validates it with `collectPayloadSchema`. It's a public contract:
add fields, never rename or remove them.

```json
{
  "siteId": "vt_…",
  "name": "pageview",
  "url": "https://myapp.com/pricing?utm_source=x",
  "referrer": "https://news.ycombinator.com/",
  "visitorId": "<uuid>",
  "sessionId": "<uuid>",
  "newSession": true
}
```

`url` is origin + path + query (no hash) so the server can read UTM,
`ref` and `via` parameters; the server stores the hostname, the path and
those campaign parameters.

Two more event names share the same fields: `"outbound"` adds `href`, the
link's origin + path (the tracker drops its query and hash), and `"goal"`
adds `goal`, a lowercase slug (`^[a-z0-9][a-z0-9_-]{0,63}$`, not `pageview`
or `outbound`). Each is one event row; the server never writes a visitor
row for them. `referrer` is
`document.referrer` on the first pageview and the previous in-site URL on
SPA pageviews (the server counts a same-site referrer as none).

## Privacy

Details in [references/privacy.md](references/privacy.md): two first-party
cookies with random ids, no PII, no fingerprinting. Changing anything there
needs the `privacy-reviewer` agent.

## Testing by hand

1. `bun run dev` (API on :8787, web on :3000). Add a site with domain
   `localhost` (allowed only in development) and copy its `vt_…` id.
2. `bun run tracker:dev`, then open
   `http://localhost:4000/?site=vt_…`. The page injects the script from
   `http://localhost:8787/script.js` with `data-allow-localhost="true"`.
3. Click the links (full loads) and "pushState to a new path" (SPA
   pageviews); "Change only the hash" sends nothing. Watch
   DevTools → Network, filter `collect`: each request answers 202.
4. `bun run db:studio` shows the rows in `visitors` and `events`, and
   `/onboarding/<id>` flips to Connected.

## Tests

`packages/tracker/test/`: payload shape, data-api override, SPA dedupe,
prerender skip, fetch fallback, cookie reuse, session rollover after 30
minutes, invalid cookie replaced, opt-out, never throwing with blocked
storage or a broken transport, localhost skip and override
(`localhost.test.ts` runs with a localhost URL).
