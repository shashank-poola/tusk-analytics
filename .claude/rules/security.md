---
paths:
  - "apps/api/src/**"
  - "packages/db/src/queries/**"
  - "packages/tracker/**"
  - "apps/web/app/**"
  - "apps/web/lib/**"
---

# Security

- Tenant isolation: every query over customer data filters by a site the
  signed-in user owns (`requireSite`, or `sites.ownerId` in the query). Return
  404 for other people's resources, never 403.
- Public endpoints (collect, webhooks) never use the session. Collect checks
  the request origin against `sites.domain`; webhooks verify the provider
  signature over the raw body before parsing.
- Referrer, UTM, path and custom-event values are attacker-controlled: zod
  validation, length caps, stored as plain text, rendered as React text
  nodes. No `dangerouslySetInnerHTML`, no building HTML or SQL from them.
- Secrets come from `c.env` only. Never log secrets, tokens, raw webhook
  bodies with card or email data, or full request headers.
- Integration credentials are stored encrypted (`encryptedCredentials`,
  `encryptedWebhookSecret`); never return them from an API.
- CORS: `corsPublic` (any origin, no credentials) only on public ingest.
  Everything else is same-origin through the Next.js rewrite.
- Review with the `security-reviewer` agent.
