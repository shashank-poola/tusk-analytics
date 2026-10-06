import { and, asc, count, eq } from "drizzle-orm"

import type { Database } from "../client"
import { funnels, type StoredFunnelStep } from "../schema"

// Funnel definitions of one site. Callers pass a site the signed-in user
// owns (requireSite); every query filters by it.

/** The site's funnels, oldest first, by funnels_site_idx. */
export function listFunnels(
  db: Database,
  { siteId, limit }: { siteId: string; limit: number }
) {
  return db
    .select()
    .from(funnels)
    .where(eq(funnels.siteId, siteId))
    .orderBy(asc(funnels.createdAt), asc(funnels.id))
    .limit(limit)
}

/** The funnel with `funnelId` if it belongs to `siteId`, else undefined. */
export async function getFunnelForSite(
  db: Database,
  { siteId, funnelId }: { siteId: string; funnelId: string }
) {
  const [funnel] = await db
    .select()
    .from(funnels)
    .where(and(eq(funnels.id, funnelId), eq(funnels.siteId, siteId)))
    .limit(1)
  return funnel
}

export async function countFunnels(
  db: Database,
  siteId: string
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(funnels)
    .where(eq(funnels.siteId, siteId))
  return row?.value ?? 0
}

export async function insertFunnel(
  db: Database,
  funnel: { siteId: string; name: string; steps: StoredFunnelStep[] }
) {
  const [inserted] = await db.insert(funnels).values(funnel).returning()
  return inserted
}

/** True when a funnel of `siteId` was deleted. */
export async function deleteFunnel(
  db: Database,
  { siteId, funnelId }: { siteId: string; funnelId: string }
): Promise<boolean> {
  const deleted = await db
    .delete(funnels)
    .where(and(eq(funnels.id, funnelId), eq(funnels.siteId, siteId)))
    .returning({ id: funnels.id })
  return deleted.length > 0
}
