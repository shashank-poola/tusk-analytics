---
paths:
  - "packages/tracker/**"
---

# Tracker (packages/tracker)

- Runs on customers' sites. Budget: 2 KB gzipped for the built script
  (`bun run check:tracker-size`, enforced in CI). Zero runtime dependencies.
- One first-party cookie only: the random visitor id that attribution needs
  (see the `tracker-script` skill). No third-party cookies, no
  fingerprinting, no PII. Collect only what
  `packages/db/src/schema/tracking.ts` stores.
- Never throw into the host page: wrap entry points, fail silently.
- Send with `navigator.sendBeacon` (fall back to `fetch` with
  `keepalive: true`), `Content-Type: text/plain` to avoid a CORS preflight.
- Strip query strings and fragments from paths before sending; send UTM
  values separately.
- Skill: `tracker-script`. Review with the `privacy-reviewer` agent.
