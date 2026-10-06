import { type SQL, sql } from "drizzle-orm"

import { events } from "../schema"
import { type SessionFilters, sessionFilterSql } from "./session-filters"

const PAGEVIEW = "pageview"
const OUTBOUND = "outbound"

/** One site's events named `name` in [fromMs, toMs), by events_site_time_idx. */
function named(siteId: string, fromMs: number, toMs: number, name: string) {
  return sql`${events.siteId} = ${siteId}
    AND ${events.createdAt} >= ${fromMs}
    AND ${events.createdAt} < ${toMs}
    AND ${events.name} = ${name}`
}

/**
 * One site's events named `name` with `fromMs <= created_at < toMs`, in the
 * sessions that match every filter, matched by events_site_time_idx
 * (site_id, created_at).
 */
export function eventsInRange(
  siteId: string,
  fromMs: number,
  toMs: number,
  name: string,
  filters: SessionFilters = {}
): SQL {
  const sources = {
    pageviews: named(siteId, fromMs, toMs, PAGEVIEW),
    outboundClicks: named(siteId, fromMs, toMs, OUTBOUND),
  }
  return sql`${named(siteId, fromMs, toMs, name)}${sessionFilterSql(sources, filters)}`
}

/** Pageviews in range and filters: the WHERE clause of every stats query. */
export function pageviewsInRange(
  siteId: string,
  fromMs: number,
  toMs: number,
  filters: SessionFilters = {}
): SQL {
  return eventsInRange(siteId, fromMs, toMs, PAGEVIEW, filters)
}

/** Outbound link clicks in range and filters. */
export function outboundClicksInRange(
  siteId: string,
  fromMs: number,
  toMs: number,
  filters: SessionFilters = {}
): SQL {
  return eventsInRange(siteId, fromMs, toMs, OUTBOUND, filters)
}
