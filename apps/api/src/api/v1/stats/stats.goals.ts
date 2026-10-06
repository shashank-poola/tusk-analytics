import {
  bucketStarts,
  GOAL_SERIES_LIMIT,
  GOALS_LIMIT,
  type StatsFilters,
  type StatsFunnelResponse,
  type StatsGoalsResponse,
  type StatsInterval,
  type StatsPeriod,
} from "@workspace/contracts"
import {
  type Database,
  getFunnelForSite,
  getFunnelSteps,
  getGoals,
  getGoalSeries,
  type Site,
} from "@workspace/db"

import { AppError } from "../../../lib/errors"
import {
  chartInterval,
  filtersOf,
  siteWindow,
  toOffsetIso,
} from "./stats.range"

// Goals and funnels: docs/metrics.md#goals and #funnels. Like the rest of
// the stats service, every function takes `now` and a site the caller has
// already checked ownership of.

type StatsSite = Pick<Site, "id" | "timezone">

/**
 * Goals completed in the period, most visitors first, with a line per
 * bucket for the top GOAL_SERIES_LIMIT.
 */
export async function getStatsGoals(
  db: Database,
  site: StatsSite,
  {
    interval: requested,
    ...query
  }: StatsPeriod & StatsFilters & { interval?: StatsInterval | undefined },
  now: Date
): Promise<StatsGoalsResponse> {
  const interval = chartInterval(query, requested)
  const window = siteWindow(query, site.timezone, now)
  const filters = filtersOf(query)
  const goals = await getGoals(db, site.id, window.fromMs, window.toMs, {
    limit: GOALS_LIMIT,
    filters,
  })
  const charted = goals.slice(0, GOAL_SERIES_LIMIT).map((goal) => goal.name)
  const seriesRows = await getGoalSeries(
    db,
    site.id,
    window.fromMs,
    window.toMs,
    { names: charted, interval, offsetMs: window.offsetMs, filters }
  )

  const starts = bucketStarts(window, interval)
  const visitorsAt = new Map(
    seriesRows.map((row) => [`${row.name}@${row.bucket}`, row.visitors])
  )
  return {
    interval,
    buckets: starts.map((start) => toOffsetIso(start, window.offsetMs)),
    goals: goals.map((goal) => ({
      ...goal,
      series: charted.includes(goal.name)
        ? starts.map(
            (start) =>
              visitorsAt.get(`${goal.name}@${start + window.offsetMs}`) ?? 0
          )
        : [],
    })),
  }
}

/** Visitors per step of one of the site's funnels; 404 for anyone else's. */
export async function getStatsFunnel(
  db: Database,
  site: StatsSite,
  {
    funnel: funnelId,
    ...query
  }: StatsPeriod & StatsFilters & { funnel: string },
  now: Date
): Promise<StatsFunnelResponse> {
  const funnel = await getFunnelForSite(db, { siteId: site.id, funnelId })
  if (!funnel) throw new AppError("not_found", "Funnel not found")
  const window = siteWindow(query, site.timezone, now)
  const counts = await getFunnelSteps(db, site.id, window.fromMs, window.toMs, {
    steps: funnel.steps,
    filters: filtersOf(query),
  })
  return {
    funnel: {
      id: funnel.id,
      name: funnel.name,
      steps: funnel.steps,
      createdAt: funnel.createdAt.toISOString(),
    },
    steps: counts.map((visitors) => ({ visitors })),
  }
}
