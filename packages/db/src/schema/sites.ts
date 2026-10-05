import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { createId } from "../lib/id"
import { user } from "./auth"
import { createdAt, updatedAt } from "./columns"

/**
 * One row per tracked website.
 * Every dashboard query must filter by sites the signed-in user owns.
 */
export const sites = sqliteTable(
  "sites",
  {
    /** Public id used in the tracking snippet, e.g. `vt_3k9x2m7qpd4n8r1t`. */
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId("vt")),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Bare hostname, e.g. `myapp.com`. Events from other hosts are rejected. */
    domain: text("domain").notNull(),
    /** IANA name, e.g. `Asia/Kolkata`. Used to draw day boundaries in charts. */
    timezone: text("timezone").notNull().default("UTC"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("sites_owner_idx").on(t.ownerId),
    uniqueIndex("sites_owner_domain_uq").on(t.ownerId, t.domain),
  ]
)

export type Site = typeof sites.$inferSelect
export type NewSite = typeof sites.$inferInsert
