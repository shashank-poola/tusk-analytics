import { and, eq } from "drizzle-orm"

import type { Database } from "../client"
import { sites } from "../schema"

/**
 * The site with `siteId`, only if `ownerId` owns it. Returns `undefined` both
 * when the site doesn't exist and when someone else owns it, so callers can't
 * tell the two apart.
 */
export async function getOwnedSite(
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
