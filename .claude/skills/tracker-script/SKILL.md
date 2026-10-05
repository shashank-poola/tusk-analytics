---
name: tracker-script
description: Builds and changes packages/tracker, the browser script customers embed, within a 2 KB gzip budget with zero dependencies, covering SPA route changes, the first-party visitor cookie, privacy rules, custom events and identify, plus how to build, size-check and test it. Use when creating or editing the tracking snippet or anything it sends to the collect endpoint.
---

# Tracker script

**Not built yet: `packages/tracker` doesn't exist.** This is the intended
design. The CI size check (`scripts/check-tracker-size.ts`) skips with a
notice until the package exists, then enforces the budget.

## Package layout

```
packages/tracker/
  package.json      name @workspace/tracker; scripts build/test/typecheck/lint
  tsconfig.json     extends @workspace/typescript-config/base.json, lib DOM
  src/index.ts      the whole script; no imports outside src/
  test/*.test.ts    Vitest + jsdom (same setup as apps/web/vitest.config.ts)
  dist/script.js    build output (gitignored)
```

Build script:
`bun build src/index.ts --minify --target=browser --format=iife --outfile=dist/script.js`.
`bun run build` (turbo) then builds it, and `bun run check:tracker-size`
checks it.

## Budget: 2 KB gzipped, zero dependencies

- No npm runtime dependencies, no polyfills, no classes where a function
  will do. Every byte ships on every customer pageview.
- If a change pushes it over, cut something. Raise the budget in
  `scripts/check-tracker-size.ts` only with the user's agreement.

## Behavior

- Config from the script tag: `data-site="vt_…"` (required), `data-api`
  (defaults to the script's own origin). Read via `document.currentScript`
  at load.
- Pageview on load, and on SPA navigation: wrap `history.pushState` and
  `history.replaceState`, listen to `popstate`. Send only when
  `location.pathname` changed (ignore hash-only and same-path changes).
- Public API: `window.viewtally(name, props?)` for custom events,
  `window.viewtally("identify", externalUserId)` once at signup. Queue
  calls made before the script loads (`window.viewtally.q`).
- Transport: `navigator.sendBeacon(url, payload)` with a `text/plain`
  string body (no CORS preflight), falling back to `fetch` with
  `keepalive: true`. Never retry, never block the page.
- Wrap everything in try/catch. The script must never throw into the host
  page.
- Don't send on `localhost`, `127.0.0.1`, `file:`, when
  `navigator.webdriver` is true, during prerender, or when
  `localStorage.viewtally_ignore === "true"` (owner opt-out).

## Privacy rules

Details in [references/privacy.md](references/privacy.md). In short: one
first-party cookie holds a random visitor id (attribution needs it to match
payments), the session id lives in `sessionStorage`, no PII, no
fingerprinting, paths without query strings. Changing anything here needs
the `privacy-reviewer` agent.

## Payload

Short keys keep bytes down. The collect endpoint's zod schema (see the
`ingest-pipeline` skill) is the contract; change both together.

```json
{
  "s": "vt_…",
  "n": "pageview",
  "u": "https://myapp.com/pricing?utm_source=x",
  "r": "https://news.ycombinator.com/",
  "v": "<visitor id>",
  "i": "<session id>",
  "p": { "plan": "pro" }
}
```

The full URL is sent so the server can read UTM parameters; the server
stores the path without the query string.

## Tests

jsdom: pageview on load; one pageview per SPA navigation, none for
same-path or hash-only changes; queued calls flush; identify sends once;
nothing sent on localhost or with the opt-out flag; a throwing
`sendBeacon` doesn't throw out of the script; the cookie has the expected
attributes.
