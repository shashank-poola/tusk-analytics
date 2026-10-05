# Raw webhook log and secret encryption (to build)

## Table: `webhook_events` (packages/db/src/schema/revenue.ts)

Proposed; create it with the `d1-migration` skill.

```ts
export const WEBHOOK_STATUSES = [
  "received",
  "processed",
  "ignored",
  "failed",
] as const

export const webhookEvents = sqliteTable(
  "webhook_events",
  {
    id: integer("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    siteId: text("site_id").notNull(),
    provider: text("provider", { enum: PAYMENT_PROVIDERS }).notNull(),
    /** The provider's event or delivery id: the idempotency key. */
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    /** Raw body exactly as received, after signature verification. */
    payload: text("payload").notNull(),
    status: text("status", { enum: WEBHOOK_STATUSES })
      .notNull()
      .default("received"),
    error: text("error"),
    receivedAt: createdAt(),
    processedAt: timestamp("processed_at"),
  },
  (t) => [
    uniqueIndex("webhook_events_integration_event_uq").on(
      t.integrationId,
      t.providerEventId
    ),
  ]
)
```

- Store only after the signature checks out, so the table can't be filled
  by anyone with the URL.
- Payloads contain customer emails and names: never log them, never return
  them from an API. Add a retention job (for example, delete processed rows
  older than 30 days) and get the `privacy-reviewer` agent's sign-off.
- D1 rows max out at 2 MB; reject larger bodies before storing.

## Integration secrets: `apps/api/src/lib/crypto.ts`

`integrations.encryptedWebhookSecret` and `encryptedCredentials` hold
AES-GCM ciphertext. Proposed helper:

- Key: a new Worker secret `INTEGRATIONS_ENCRYPTION_KEY` (32 random bytes,
  base64). Add it to `envSchema` in `src/config/env.ts` and a fixed test
  value in `apps/api/vitest.config.ts`. The user sets it with
  `wrangler secret put`; an agent never does.
- Format: `v1:<base64 iv>:<base64 ciphertext>` with a fresh 12-byte IV per
  value, so the key can be rotated later (`v2:`).
- Import the key once per request:
  `crypto.subtle.importKey("raw", key, "AES-GCM", false, usages)` with
  `usages = ["encrypt", "decrypt"]`.
- Tests: round trip, tampered ciphertext fails, wrong key fails.
