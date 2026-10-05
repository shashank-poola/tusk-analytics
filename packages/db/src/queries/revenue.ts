import { and, count, desc, eq, gte, isNull, sql, sum } from "drizzle-orm"

import type { Database } from "../client"
import { payments, visitors } from "../schema"

/**
 * Revenue grouped by each paying visitor's first-touch source.
 * Refunded payments are excluded. The caller must check that the signed-in
 * user owns `siteId`.
 */
export function getRevenueBySource(
  db: Database,
  { siteId, since }: { siteId: string; since: Date }
) {
  const source = sql<string>`coalesce(${visitors.firstSource}, 'unknown')`
  const revenueUsd = sum(payments.amountUsd).mapWith(Number)

  return db
    .select({ source, payments: count(), revenueUsd })
    .from(payments)
    .leftJoin(
      visitors,
      and(
        eq(visitors.siteId, payments.siteId),
        eq(visitors.visitorId, payments.visitorId)
      )
    )
    .where(
      and(
        eq(payments.siteId, siteId),
        isNull(payments.refundedAt),
        gte(payments.paidAt, since)
      )
    )
    .groupBy(source)
    .orderBy(desc(revenueUsd))
}
