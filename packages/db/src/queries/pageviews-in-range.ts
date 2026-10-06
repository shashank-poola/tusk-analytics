import { type SQL, sql } from "drizzle-orm"

import { events } from "../schema"

const PAGEVIEW = "pageview"

/**
 * One site's pageviews with `fromMs <= created_at < toMs`: the WHERE clause of
 * every stats query, matched by events_site_time_idx (site_id, created_at).
 */
export function pageviewsInRange(
  siteId: string,
  fromMs: number,
  toMs: number
): SQL {
  return sql`${events.siteId} = ${siteId}
    AND ${events.createdAt} >= ${fromMs}
    AND ${events.createdAt} < ${toMs}
    AND ${events.name} = ${PAGEVIEW}`
}
