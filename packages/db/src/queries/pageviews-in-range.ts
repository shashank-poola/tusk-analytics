import { type SQL, sql } from "drizzle-orm"

import { events } from "../schema"
import { type SessionFilters, sessionFilterSql } from "./session-filters"

const PAGEVIEW = "pageview"
const OUTBOUND = "outbound"

/** One site's events in [fromMs, toMs) whose name matches, by events_site_time_idx. */
function named(siteId: string, fromMs: number, toMs: number, name: SQL) {
  return sql`${events.siteId} = ${siteId}
    AND ${events.createdAt} >= ${fromMs}
    AND ${events.createdAt} < ${toMs}
    AND ${name}`
}

/**
 * One site's events with `fromMs <= created_at < toMs` whose name matches,
 * in the sessions that match every filter, matched by events_site_time_idx
 * (site_id, created_at).
 */
function scoped(
  siteId: string,
  fromMs: number,
  toMs: number,
  name: SQL,
  filters: SessionFilters
): SQL {
  const sources = {
    pageviews: named(siteId, fromMs, toMs, sql`${events.name} = ${PAGEVIEW}`),
    outboundClicks: named(
      siteId,
      fromMs,
      toMs,
      sql`${events.name} = ${OUTBOUND}`
    ),
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
  return scoped(
    siteId,
    fromMs,
    toMs,
    sql`${events.name} = ${PAGEVIEW}`,
    filters
  )
}

/** Outbound link clicks in range and filters. */
export function outboundClicksInRange(
  siteId: string,
  fromMs: number,
  toMs: number,
  filters: SessionFilters = {}
): SQL {
  return scoped(
    siteId,
    fromMs,
    toMs,
    sql`${events.name} = ${OUTBOUND}`,
    filters
  )
}

/** Goal completions (every event the tracker doesn't name itself). */
export function goalsInRange(
  siteId: string,
  fromMs: number,
  toMs: number,
  filters: SessionFilters = {}
): SQL {
  const goal = sql`${events.name} NOT IN (${PAGEVIEW}, ${OUTBOUND})`
  return scoped(siteId, fromMs, toMs, goal, filters)
}

/** Pageviews and goal completions in range and filters: funnel steps. */
export function stepsInRange(
  siteId: string,
  fromMs: number,
  toMs: number,
  filters: SessionFilters = {}
): SQL {
  return scoped(
    siteId,
    fromMs,
    toMs,
    sql`${events.name} <> ${OUTBOUND}`,
    filters
  )
}
