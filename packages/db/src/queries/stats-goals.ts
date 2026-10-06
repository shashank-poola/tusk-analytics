import { sql } from "drizzle-orm"

import type { Database } from "../client"
import { events } from "../schema"
import { bucketOf, type TimeseriesInterval } from "./buckets"
import { goalsInRange } from "./pageviews-in-range"
import type { SessionFilters } from "./session-filters"

// Definition: docs/metrics.md#goals. Reads one site's goal events in
// [fromMs, toMs) through events_site_time_idx (site_id, created_at); the
// caller must check that the signed-in user owns `siteId`.

type GoalRow = { name: string; visitors: number; completions: number }
type GoalBucketRow = { name: string; bucket: number; visitors: number }

/** Goals by distinct visitors who completed them, then name. */
export function getGoals(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  { limit, filters = {} }: { limit: number; filters?: SessionFilters }
): Promise<GoalRow[]> {
  return db.all<GoalRow>(sql`
    SELECT
      ${events.name} AS name,
      count(DISTINCT ${events.visitorId}) AS visitors,
      count(*) AS completions
    FROM ${events}
    WHERE ${goalsInRange(siteId, fromMs, toMs, filters)}
    GROUP BY name
    ORDER BY visitors DESC, name
    LIMIT ${limit}`)
}

/** Distinct visitors per bucket for each of `names`; buckets without any have no row. */
export function getGoalSeries(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  {
    names,
    interval,
    offsetMs,
    filters = {},
  }: {
    /** At most GOAL_SERIES_LIMIT names: each is a bound parameter. */
    names: string[]
    interval: TimeseriesInterval
    offsetMs: number
    filters?: SessionFilters
  }
): Promise<GoalBucketRow[]> {
  if (names.length === 0) return Promise.resolve([])
  return db.all<GoalBucketRow>(sql`
    SELECT
      ${events.name} AS name,
      ${bucketOf(interval, offsetMs)} AS bucket,
      count(DISTINCT ${events.visitorId}) AS visitors
    FROM ${events}
    WHERE ${goalsInRange(siteId, fromMs, toMs, filters)}
      AND ${events.name} IN (${sql.join(
        names.map((name) => sql`${name}`),
        sql`, `
      )})
    GROUP BY name, bucket`)
}
