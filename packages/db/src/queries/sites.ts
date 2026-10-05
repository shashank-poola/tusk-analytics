import { and, desc, eq } from "drizzle-orm"

import type { Database } from "../client"
import { type NewSite, sites } from "../schema"

/**
 * The owner's sites, newest first. Filtered by `sites_owner_idx`; the sort
 * runs over that owner's rows only.
 */
export function listSitesByOwner(
  db: Database,
  { ownerId, limit }: { ownerId: string; limit: number }
) {
  return db
    .select()
    .from(sites)
    .where(eq(sites.ownerId, ownerId))
    .orderBy(desc(sites.createdAt), desc(sites.id))
    .limit(limit)
}

/**
 * The site with `siteId`, only if `ownerId` owns it. Returns `undefined` both
 * when the site doesn't exist and when someone else owns it, so callers can't
 * tell the two apart.
 */
export async function getSiteForOwner(
  db: Database,
  { siteId, ownerId }: { siteId: string; ownerId: string }
) {
  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.ownerId, ownerId)))
    .limit(1)
  return site
}

/**
 * Inserts the site, or returns `undefined` when the owner already has one with
 * this domain (`sites_owner_domain_uq`).
 */
export async function insertSite(
  db: Database,
  site: Pick<NewSite, "ownerId" | "name" | "domain" | "timezone">
) {
  const [inserted] = await db
    .insert(sites)
    .values(site)
    .onConflictDoNothing({ target: [sites.ownerId, sites.domain] })
    .returning()
  return inserted
}
