---
name: add-payment-provider
description: Adds a payment provider webhook to apps/api that verifies the signature on the raw body, logs the raw event before processing, deduplicates by idempotency key, maps the event to the payments table and attributes it to a visitor, with tests. Use when integrating Stripe, Polar, Paddle, Lemon Squeezy, Dodo, Razorpay or another provider, or when changing a webhook handler.
---

# Add a payment provider

**Partly built.** What exists: `PAYMENT_PROVIDERS`, `integrations` (with
`encryptedWebhookSecret`) and `payments` in
`packages/db/src/schema/revenue.ts`. Not built yet: any webhook route, the
raw webhook log table, and the AES-GCM helper for integration secrets.
Build those first, following
[references/webhook-log.md](references/webhook-log.md).

## Files

```
apps/api/src/api/v1/webhooks/
  webhooks.routes.ts          POST /api/v1/webhooks/:provider/:integrationId
  webhooks.service.ts         log → dedupe → map → store payment
  providers/<provider>.ts     verify(request, rawBody, secret) + toPayment(event)
apps/api/test/webhooks.<provider>.test.ts
```

The route is public: no `requireUser`, no CORS. It finds the integration by
`:integrationId`, so the site comes from our database, never from the
payload.

## Handler order (don't reorder)

1. `const raw = await c.req.text()`: the raw body, before any parsing.
   Signatures are computed over exact bytes; `c.req.json()` loses them.
2. Load the integration by id and `provider`; unknown or `disconnected` → 404.
3. Decrypt `encryptedWebhookSecret` and **verify the signature** with
   `crypto.subtle` (HMAC, constant-time `verify`). Enforce the provider's
   timestamp tolerance (5 minutes) to stop replays. Invalid → 400, log
   nothing from the body.
4. **Write the raw event** to `webhook_events` with
   `.onConflictDoNothing()` on `(integration_id, provider_event_id)`. If the
   row already exists with `status = 'processed'`, return 200 now: this is a
   retry.
5. Parse and map the event (`providers/<provider>.ts`). Event types we don't
   handle → mark `ignored`, return 200.
6. Match the visitor (see the `attribution-model` skill), then insert into
   `payments` with `.onConflictDoNothing()`. Refunds update `refundedAt`.
   Do 6 and the status update in one `db.batch()`.
7. Mark the event `processed` (or `failed` with `error`), return 200.
   Unexpected errors → 500 so the provider retries.

## Mapping rules

- `providerPaymentId`: the id that's unique per charge (Stripe invoice
  `in_…` for subscriptions, payment intent for one-time).
- `type`: first payment of a subscription → `new_subscription`; later →
  `renewal`; otherwise `one_time`.
- `amount` in minor units as the provider sends it. `currency` uppercased.
  `amountUsd` converted at `paidAt`. The FX source isn't decided yet: ask
  before picking one, and never store `amountUsd = amount` for non-USD.
- `paidAt` from the provider's timestamp, not `Date.now()`.

## Tests (required)

Valid signature stores one payment; bad signature → 400 and no rows;
timestamp outside tolerance → 400; the same event twice → one payment, one
log row; refund sets `refundedAt` once; renewal inherits the first payment's
visitor; unknown event type → 200 + `ignored`; an integration id from
another site can't write to this site. Build signed payloads in a test
helper with the same HMAC code the provider uses (see
[references/providers.md](references/providers.md)); never call the real
provider.

## Adding a new provider name

Add it to `PAYMENT_PROVIDERS`. It's a TS-only enum on a `text` column, so
`bun run db:generate` should say "No schema changes". If it writes a
migration, review it with the `d1-migration` skill.
