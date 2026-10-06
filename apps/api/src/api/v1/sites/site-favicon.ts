import { AppError } from "../../../lib/errors"
import { cacheFavicon, readCachedFavicon } from "./favicon-cache"
import {
  getPublic,
  isFetchableUrl,
  mimeType,
  type Outcome,
  readAtMost,
} from "./favicon-http"
import { findIconUrls } from "./favicon-links"
import type { Favicon } from "./favicon-response"

/** Icon links sit in <head>; this is plenty and bounds the scan. */
const MAX_HTML_BYTES = 64 * 1024
export const MAX_ICON_BYTES = 200 * 1024

const HTML_TYPES = new Set(["text/html", "application/xhtml+xml"])
const ICON_TYPES = new Set([
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "image/gif",
  "image/jpeg",
])

/** The best fetchable icon the home page links to. */
async function findLinkedIcon(homePage: URL): Promise<Outcome<URL>> {
  const page = await getPublic(homePage, "text/html")
  if (!page.ok) return page

  const { res, url: pageUrl } = page.value
  const type = mimeType(res)
  if (!HTML_TYPES.has(type)) {
    await res.body?.cancel()
    return { ok: false, reason: `content-type "${type}"` }
  }

  const body = await readAtMost(res, MAX_HTML_BYTES)
  if (!body.ok) return body

  // Relative hrefs resolve against the final URL after redirects.
  const html = new TextDecoder().decode(body.value.bytes)
  const best = findIconUrls(html, pageUrl).find(isFetchableUrl)
  return best
    ? { ok: true, value: best }
    : { ok: false, reason: "no fetchable icon link" }
}

async function fetchIcon(url: URL): Promise<Outcome<Favicon>> {
  const icon = await getPublic(url, "image/*")
  if (!icon.ok) return icon

  const { res } = icon.value
  const contentType = mimeType(res)
  const declaredLength = Number(res.headers.get("content-length") ?? 0)
  if (!ICON_TYPES.has(contentType) || declaredLength > MAX_ICON_BYTES) {
    await res.body?.cancel()
    return {
      ok: false,
      reason: `content-type "${contentType}", content-length ${declaredLength}`,
    }
  }

  const body = await readAtMost(res, MAX_ICON_BYTES)
  if (!body.ok) return body
  if (body.value.truncated) {
    return { ok: false, reason: `larger than ${MAX_ICON_BYTES} bytes` }
  }
  if (body.value.bytes.length === 0) return { ok: false, reason: "empty body" }
  return { ok: true, value: { bytes: body.value.bytes, contentType } }
}

/**
 * The best `<link rel="icon">` (or apple-touch-icon) on the home page, else
 * /favicon.ico. Each request follows at most three redirects. Every URL must
 * pass `isFetchableUrl`, so localhost sites are never fetched.
 */
async function fetchFavicon(domain: string): Promise<Outcome<Favicon>> {
  const failures: string[] = []
  const linked = await findLinkedIcon(new URL(`https://${domain}/`))
  const fallback = new URL(`https://${domain}/favicon.ico`)
  const candidates: [string, URL][] = []
  if (linked.ok && linked.value.href !== fallback.href) {
    candidates.push(["linked icon", linked.value])
  }
  if (!linked.ok) failures.push(`home page: ${linked.reason}`)
  candidates.push(["/favicon.ico", fallback])

  for (const [label, url] of candidates) {
    const icon = await fetchIcon(url)
    if (icon.ok) return icon
    failures.push(`${label}: ${icon.reason}`)
  }
  return { ok: false, reason: failures.join("; ") }
}

function faviconNotFound(domain: string): AppError {
  return new AppError(
    "not_found",
    `No favicon found for ${domain}. Link one from your home page with <link rel="icon" href="..."> or serve an image at /favicon.ico.`
  )
}

/**
 * The site's favicon, from the cache or fetched (and then cached through
 * `waitUntil`). Throws a 404 `AppError` when the site has none.
 */
export async function getSiteFavicon(
  site: { id: string; domain: string },
  waitUntil: (promise: Promise<unknown>) => void
): Promise<Favicon> {
  const cached = await readCachedFavicon(site)
  switch (cached.kind) {
    case "found":
      return cached.favicon
    case "none":
      throw faviconNotFound(site.domain)
    case "miss":
      break
    default:
      throw new Error(
        `Unhandled cache result: ${String(cached satisfies never)}`
      )
  }

  const fetched = await fetchFavicon(site.domain)
  waitUntil(cacheFavicon(site, fetched.ok ? fetched.value : null))
  if (fetched.ok) return fetched.value

  console.warn(
    `GET /api/v1/sites/:siteId/favicon: no favicon for site ${site.id} (${fetched.reason})`
  )
  throw faviconNotFound(site.domain)
}
