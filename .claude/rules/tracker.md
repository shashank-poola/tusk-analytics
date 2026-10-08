---
paths:
  - "packages/tracker/**"
---

# Tracker (packages/tracker)

- Runs on customers' sites. Budget: 2 KB gzipped for the built script
  (`bun run check:tracker-size`, enforced in CI). Zero runtime
  dependencies; only `import type` from `@workspace/contracts`.
- Two first-party cookies only, both random ids: `vt_vid` (visitor, which
  attribution needs) and `vt_sid` (session); none at all in cookieless
  mode (`data-cookieless="true"`). No third-party cookies, no
  fingerprinting, no PII. Collect only what
  `packages/db/src/schema/tracking.ts` stores (see the `tracker-script`
  skill for what is sent and reduced server-side).
- Never throw into the host page: wrap entry points and storage access,
  fail silently.
- Send with `navigator.sendBeacon` (fall back to `fetch` with
  `keepalive: true`), `text/plain` body to avoid a CORS preflight.
- Send the URL without its hash; the server keeps the path and UTM values
  only.
- Skill: `tracker-script`. Review with the `privacy-reviewer` agent.
