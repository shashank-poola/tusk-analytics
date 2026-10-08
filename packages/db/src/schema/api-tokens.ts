import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { createId } from "../lib/id"
import { user } from "./auth"
import { createdAt, timestamp } from "./columns"

/**
 * Account tokens for the MCP server and, later, the API: one row per token
 * a user created in Settings. The token itself is shown once and never
 * stored; `tokenHash` (SHA-256, hex) is what a request is checked against.
 */
export const apiTokens = sqliteTable(
  "api_tokens",
  {
    /** Public id, e.g. `tok_3k9x2m7qpd4n8r1t`. */
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId("tok")),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** What the user called it, e.g. "Claude Code". */
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull(),
    /** The token's first characters, so the list can tell tokens apart. */
    prefix: text("prefix").notNull(),
    /** Refreshed at most hourly, so using a token rarely costs a write. */
    lastUsedAt: timestamp("last_used_at"),
    createdAt: createdAt(),
  },
  (t) => [
    // Every MCP request looks its token up by hash.
    uniqueIndex("api_tokens_hash_uq").on(t.tokenHash),
    // Settings lists a user's tokens, newest first.
    index("api_tokens_user_idx").on(t.userId, t.createdAt),
  ]
)

export type ApiTokenRow = typeof apiTokens.$inferSelect
