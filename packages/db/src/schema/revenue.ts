import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import { createId } from "../lib/id"
import { createdAt, timestamp, updatedAt } from "./columns"
import { sites } from "./sites"

export const PAYMENT_PROVIDERS = [
  "stripe",
  "dodo",
  "polar",
  "paddle",
  "lemonsqueezy",
  "razorpay",
] as const
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number]

export const INTEGRATION_STATUSES = ["active", "error", "disconnected"] as const
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number]

export const PAYMENT_TYPES = [
  "one_time",
  "new_subscription",
  "renewal",
] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

/** A payment provider connected to a site. At most one per provider. */
export const integrations = sqliteTable(
  "integrations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId("int")),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: PAYMENT_PROVIDERS }).notNull(),
    status: text("status", { enum: INTEGRATION_STATUSES })
      .notNull()
      .default("active"),
    // Encrypted by the app before insert (AES-GCM). Never store plaintext.
    /** Read-only API key, e.g. a Stripe restricted key. */
    encryptedCredentials: text("encrypted_credentials"),
    /** Secret used to verify this provider's webhook signatures. */
    encryptedWebhookSecret: text("encrypted_webhook_secret"),
    lastSyncedAt: timestamp("last_synced_at"),
    lastError: text("last_error"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("integrations_site_provider_uq").on(t.siteId, t.provider)]
)

/**
 * One row per successful payment, from webhooks or a backfill.
 *
 * Renewals usually arrive without the checkout metadata. When storing one,
 * copy `visitorId` from the customer's earlier payment (same
 * `providerCustomerId`) so lifetime value stays with the first-touch source.
 */
export const payments = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: PAYMENT_PROVIDERS }).notNull(),
    /** The provider's payment or invoice id, e.g. Stripe `in_...`. */
    providerPaymentId: text("provider_payment_id").notNull(),
    /** The provider's customer id, e.g. Stripe `cus_...`. Links renewals. */
    providerCustomerId: text("provider_customer_id"),
    /** Null when the payment couldn't be matched to a visitor. */
    visitorId: text("visitor_id"),
    externalUserId: text("external_user_id"),
    type: text("type", { enum: PAYMENT_TYPES }).notNull(),
    /** Minor units (cents, paise) in `currency`. */
    amount: integer("amount").notNull(),
    /** ISO 4217, uppercase: `USD`, `INR`, `EUR`. */
    currency: text("currency").notNull(),
    /** `amount` converted to US cents at payment time, so totals can be summed. */
    amountUsd: integer("amount_usd").notNull(),
    /** When the customer paid, per the provider. Charts use this, not createdAt. */
    paidAt: timestamp("paid_at").notNull(),
    refundedAt: timestamp("refunded_at"),
    createdAt: createdAt(),
  },
  (t) => [
    // Webhooks get retried; with this, inserts are safe to repeat
    // (use onConflictDoNothing). Scoped by site because one Stripe account
    // can be connected to several sites.
    uniqueIndex("payments_site_provider_payment_uq").on(
      t.siteId,
      t.provider,
      t.providerPaymentId
    ),
    index("payments_site_paid_idx").on(t.siteId, t.paidAt),
    index("payments_site_customer_idx").on(
      t.siteId,
      t.provider,
      t.providerCustomerId
    ),
  ]
)

export type Integration = typeof integrations.$inferSelect
export type NewIntegration = typeof integrations.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
