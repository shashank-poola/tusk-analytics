---
name: attribution-model
description: How Viewtally links a payment to the visitor's first-touch traffic source, including matching order, renewals, refunds, unmatched payments, idempotent webhook inserts and reconciliation. Use when writing or reviewing code that stores payments, matches them to visitors, or computes revenue by source, such as packages/db/src/queries/revenue.ts or payment webhook handlers.
---

# Attribution model

Revenue is attributed to the visitor's **first touch**, and attribution is a
join: `payments.visitorId` → `visitors (siteId, visitorId)` →
`visitors.firstSource`. Nothing is copied into `payments` except the
visitor id. Source of truth:

- `packages/db/src/schema/tracking.ts`: `visitors.first*`, `externalUserId`
- `packages/db/src/schema/revenue.ts`: `payments`, `PAYMENT_TYPES`
- `packages/db/src/queries/revenue.ts`: `getRevenueBySource()`

## Matching a payment to a visitor (first hit wins)

1. **Checkout metadata**: the site owner passes the tracker's visitor id
   into the provider's checkout metadata (planned key:
   `viewtally_visitor_id`). Use it only if that visitor exists for this
   `siteId`.
2. **External user id**: the owner called identify at signup, so
   `visitors.externalUserId` matches the payment's customer reference. Look
   up via `visitors_external_user_idx (site_id, external_user_id)`. If
   several visitors match, take the earliest `firstSeenAt`.
3. **Earlier payment of the same customer**: same `siteId`, `provider`,
   `providerCustomerId` (`payments_site_customer_idx`); copy its
   `visitorId`. This is how renewals keep their source.
4. Otherwise store `visitorId = null`. The payment is **unmatched** and
   shows as `unknown` in `getRevenueBySource` (it coalesces a missing
   source to `'unknown'`).

## Payment types and lifecycle

- `type`: `one_time`, `new_subscription`, `renewal`. Renewals usually arrive
  without checkout metadata, so step 3 matters most for them.
- **Refunds** set `refundedAt` on the existing row (matched by `siteId`,
  `provider`, `providerPaymentId`); never delete the row.
  `getRevenueBySource` excludes rows with `refundedAt`. Partial refunds
  aren't modeled yet (no refunded-amount column); flag it if a provider
  sends one.
- `paidAt` is the provider's payment time, and charts use it.
  `createdAt` is only when we stored the row.
- Money: `amount` in minor units of `currency`; `amountUsd` in US cents at
  payment time is what gets summed. Never sum `amount` across currencies.

## Idempotency

Providers retry webhooks and send events out of order.

- Insert with `.onConflictDoNothing()`; the unique index
  `payments_site_provider_payment_uq` on
  `(site_id, provider, provider_payment_id)` makes repeats no-ops.
- A refund that arrives before its payment: store nothing yet and return
  500 so the provider retries, or record it in the raw webhook log and let
  reconciliation apply it. Don't create a payment row from a refund event.
- Updates are conditional (`... AND refunded_at IS NULL`), so replays
  don't move timestamps.

## Reconciliation (planned)

A scheduled Worker (Cron Trigger) per site with an active integration:

1. Re-match unmatched payments (`visitorId IS NULL`) using steps 2–3, since
   an identify call can arrive after the payment.
2. Backfill from the provider API since `integrations.lastSyncedAt`, using
   the same insert path as webhooks. Set `lastSyncedAt` and `lastError`.
3. Apply refunds that the webhook path missed.

Write in chunks with `db.batch()`, within D1 limits (see the `d1-migration`
skill).

## Rules for revenue queries

- Always filter by `siteId` and check that the caller owns it first
  (`requireSite`).
- Exclude refunded rows unless the query is explicitly about refunds.
- Bucket by `paidAt` in the site's `timezone` (`sites.timezone`).
- Test with: matched, unmatched, renewal inheriting the source, refunded,
  and two sites sharing one Stripe account (same `providerPaymentId`,
  different `siteId`).
