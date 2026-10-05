import { drizzle } from "drizzle-orm/d1"

import * as schema from "./schema"

/**
 * Wraps a D1 binding. Call once per request; it's cheap.
 *
 * @example
 * const db = createDb(env.DB)
 * const mySites = await db.query.sites.findMany({
 *   where: (s, { eq }) => eq(s.ownerId, userId),
 * })
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type Database = ReturnType<typeof createDb>
