import { type SQL, sql } from "drizzle-orm"

import type { Database } from "../client"
import { events, type StoredFunnelStep } from "../schema"
import { stepsInRange } from "./pageviews-in-range"
import type { SessionFilters } from "./session-filters"

// Definition: docs/metrics.md#funnels. The caller must check that the
// signed-in user owns `siteId`.

const PAGEVIEW = "pageview"

function matches(step: StoredFunnelStep): SQL {
  return step.type === "page"
    ? sql`name = ${PAGEVIEW} AND path = ${step.value}`
    : sql`name = ${step.value}`
}

/**
 * Visitors who reached each step, in order: step 1 anywhere in the range,
 * each next step at or after the moment they first reached the one before.
 * The range is read once into `scoped`; each step joins the one before on
 * visitor, so nothing runs per visitor.
 */
export async function getFunnelSteps(
  db: Database,
  siteId: string,
  fromMs: number,
  toMs: number,
  {
    steps,
    filters = {},
  }: { steps: StoredFunnelStep[]; filters?: SessionFilters }
): Promise<number[]> {
  const stepTables = steps.map((step, index) => {
    const table = sql.raw(`step_${index}`)
    if (index === 0) {
      return sql`, ${table} AS (
        SELECT visitor_id, min(created_at) AS at
        FROM scoped
        WHERE ${matches(step)}
        GROUP BY visitor_id
      )`
    }
    const before = sql.raw(`step_${index - 1}`)
    return sql`, ${table} AS (
      SELECT scoped.visitor_id, min(scoped.created_at) AS at
      FROM scoped
      JOIN ${before} ON ${before}.visitor_id = scoped.visitor_id
        AND scoped.created_at >= ${before}.at
      WHERE ${matches(step)}
      GROUP BY scoped.visitor_id
    )`
  })
  const counts = steps.map(
    (_, index) =>
      sql`(SELECT count(*) FROM ${sql.raw(`step_${index}`)}) AS ${sql.raw(`s${index}`)}`
  )
  const [row] = await db.all<Record<string, number>>(sql`
    WITH scoped AS (
      SELECT
        ${events.visitorId} AS visitor_id,
        ${events.name} AS name,
        ${events.path} AS path,
        ${events.createdAt} AS created_at
      FROM ${events}
      WHERE ${stepsInRange(siteId, fromMs, toMs, filters)}
    )${sql.join(stepTables)}
    SELECT ${sql.join(counts, sql`, `)}`)
  return steps.map((_, index) => row?.[`s${index}`] ?? 0)
}
