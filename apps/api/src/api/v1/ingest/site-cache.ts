import { type Database, eq, sites } from "@workspace/db"

type SiteDomain = { id: string; domain: string }

const SITE_CACHE_TTL_MS = 60_000
const SITE_CACHE_MAX_ENTRIES = 1_000

// Per isolate, so most events skip the D1 read. Unknown ids are cached too,
// which bounds reads for repeated junk. A miss or an evicted entry only
// costs one read, so correctness never depends on it. Entries can be up to
// a minute stale, which is fine while sites can't change their domain.
const siteCache = new Map<
  string,
  { site: SiteDomain | null; expiresAt: number }
>()

/** The site's id and domain, or null when no site has this id. */
export async function findSite(
  db: Database,
  siteId: string,
  now: number
): Promise<SiteDomain | null> {
  const cached = siteCache.get(siteId)
  if (cached && cached.expiresAt > now) return cached.site

  const [row] = await db
    .select({ id: sites.id, domain: sites.domain })
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1)
  const site = row ?? null

  siteCache.delete(siteId)
  if (siteCache.size >= SITE_CACHE_MAX_ENTRIES) {
    // Maps iterate in insertion order, so this is the oldest entry.
    const oldest = siteCache.keys().next().value
    if (oldest !== undefined) siteCache.delete(oldest)
  }
  siteCache.set(siteId, { site, expiresAt: now + SITE_CACHE_TTL_MS })
  return site
}
