import type { Favicon } from "./favicon-response"

/**
 * Caches favicon lookups in the Workers Cache API so dashboard loads, and
 * repeated hits on a domain someone typed in, don't refetch it. Only an
 * optimization: any cache failure counts as a miss. In production
 * caches.default only works on a custom domain; on *.workers.dev it is a
 * no-op and every request fetches. Locally, Miniflare simulates it.
 */
const FOUND_TTL_SECONDS = 24 * 60 * 60
const NONE_TTL_SECONDS = 60 * 60
/** Set on the cached "this site has no favicon" marker. */
const NONE_HEADER = "X-Viewtally-Favicon"

export type CachedFavicon =
  { kind: "found"; favicon: Favicon } | { kind: "none" } | { kind: "miss" }

/**
 * Synthetic and never fetched. The domain is part of it so changing a site's
 * domain skips the old entry; requireSite has already checked the owner.
 */
function cacheKey(site: { id: string; domain: string }): string {
  return `https://favicon-cache.viewtally.internal/${site.id}/${encodeURIComponent(site.domain)}`
}

export async function readCachedFavicon(site: {
  id: string
  domain: string
}): Promise<CachedFavicon> {
  try {
    const cached = await caches.default.match(cacheKey(site))
    if (!cached) return { kind: "miss" }
    if (cached.headers.get(NONE_HEADER) === "none") {
      await cached.body?.cancel()
      return { kind: "none" }
    }
    const contentType = cached.headers.get("content-type") ?? ""
    const bytes = new Uint8Array(await cached.arrayBuffer())
    return { kind: "found", favicon: { bytes, contentType } }
  } catch (error) {
    console.warn(
      `GET /api/v1/sites/:siteId/favicon: cache read failed for site ${site.id}, fetching instead`,
      error
    )
    return { kind: "miss" }
  }
}

/** Stores a found favicon for a day, or a "none" marker for an hour. */
export async function cacheFavicon(
  site: { id: string; domain: string },
  favicon: Favicon | null
): Promise<void> {
  const entry = favicon
    ? // A copy, so the cache never shares a buffer with the live response.
      new Response(favicon.bytes.slice(), {
        headers: {
          "Content-Type": favicon.contentType,
          "Cache-Control": `max-age=${FOUND_TTL_SECONDS}`,
        },
      })
    : new Response(null, {
        headers: {
          [NONE_HEADER]: "none",
          "Cache-Control": `max-age=${NONE_TTL_SECONDS}`,
        },
      })
  try {
    await caches.default.put(cacheKey(site), entry)
  } catch (error) {
    console.warn(
      `GET /api/v1/sites/:siteId/favicon: cache write failed for site ${site.id}`,
      error
    )
  }
}
