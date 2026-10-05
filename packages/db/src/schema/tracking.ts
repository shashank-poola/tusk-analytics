import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core"

import { createdAt, timestamp } from "./columns"

// High-volume tables. They have no foreign key to `sites` on purpose:
// a cascade over millions of rows would exceed D1's per-query limits, and an
// FK check slows the hot insert path. Delete a site's rows in batches instead.

export const DEVICES = ["desktop", "mobile", "tablet"] as const
export type Device = (typeof DEVICES)[number]

/**
 * One row per visitor, written on their first event.
 * Revenue attribution is a join: a payment points at a visitor, and the
 * visitor remembers where they first came from.
 */
export const visitors = sqliteTable(
  "visitors",
  {
    siteId: text("site_id").notNull(),
    visitorId: text("visitor_id").notNull(),
    /** Cleaned channel: `google`, `x`, `chatgpt`, `newsletter`, `direct`... */
    firstSource: text("first_source"),
    /** Referrer hostname. */
    firstReferrer: text("first_referrer"),
    firstUtmSource: text("first_utm_source"),
    firstUtmMedium: text("first_utm_medium"),
    firstUtmCampaign: text("first_utm_campaign"),
    /** Path of the first page seen, e.g. `/blog/launch`. */
    firstLandingPath: text("first_landing_path"),
    /** ISO 3166-1 alpha-2, from `request.cf.country`. */
    firstCountry: text("first_country"),
    /**
     * The site owner's own id for this person, sent by an identify call at
     * signup. Lets a payment that arrives days later find its visitor.
     */
    externalUserId: text("external_user_id"),
    firstSeenAt: timestamp("first_seen_at").notNull(),
    lastSeenAt: timestamp("last_seen_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.siteId, t.visitorId] }),
    index("visitors_external_user_idx").on(t.siteId, t.externalUserId),
  ]
)

/** One row per pageview or custom event. */
export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey(),
    siteId: text("site_id").notNull(),
    visitorId: text("visitor_id").notNull(),
    /** Groups events into a visit; used for bounce rate and visit duration. */
    sessionId: text("session_id").notNull(),
    /** `pageview`, or a custom name such as `signup` or `checkout_started`. */
    name: text("name").notNull().default("pageview"),
    /** Path without the query string, e.g. `/pricing`. */
    path: text("path").notNull(),
    referrer: text("referrer"),
    source: text("source"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    country: text("country"),
    browser: text("browser"),
    os: text("os"),
    device: text("device", { enum: DEVICES }),
    /** Custom event properties, e.g. `{ "plan": "pro" }`. */
    props: text("props", { mode: "json" }).$type<
      Record<string, string | number | boolean>
    >(),
    createdAt: createdAt(),
  },
  (t) => [
    index("events_site_time_idx").on(t.siteId, t.createdAt),
    index("events_site_visitor_idx").on(t.siteId, t.visitorId),
  ]
)

export type Visitor = typeof visitors.$inferSelect
export type NewVisitor = typeof visitors.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
