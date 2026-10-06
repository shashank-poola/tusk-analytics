import { index, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { createId } from "../lib/id"
import { createdAt } from "./columns"
import { sites } from "./sites"

/** A step is reached by viewing a page or completing a goal. */
export type StoredFunnelStep = { type: "page" | "goal"; value: string }

/**
 * Ordered steps a site owner wants visitors to go through, e.g. landing
 * page → pricing → signup. Few rows per site, so a foreign key is cheap.
 */
export const funnels = sqliteTable(
  "funnels",
  {
    /** Public id, e.g. `fn_3k9x2m7qpd4n8r1t`. */
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId("fn")),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Validated by `createFunnelInputSchema` in @workspace/contracts. */
    steps: text("steps", { mode: "json" })
      .$type<StoredFunnelStep[]>()
      .notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("funnels_site_idx").on(t.siteId, t.createdAt)]
)

export type FunnelRow = typeof funnels.$inferSelect
