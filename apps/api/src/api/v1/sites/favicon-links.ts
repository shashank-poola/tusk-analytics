/**
 * Finds favicon links in a site's home page HTML. A small regex scan, not an
 * HTML parser: it only needs the `<link>` tags. The caller caps the input at
 * 64 KB; on top of that a tag is at most 2048 characters, at most
 * `MAX_LINK_TAGS_SCANNED` tags are looked at, and each tag at most
 * `MAX_ATTRIBUTES_PER_TAG` attributes, so a hostile page can't make it slow.
 */
const MAX_LINK_TAGS_SCANNED = 256
const MAX_ATTRIBUTES_PER_TAG = 16
const MAX_HREF_LENGTH = 2048

// {0,2048} keeps a failed match (no closing ">") to bounded work.
const LINK_TAG = /<link\b([^>]{0,2048})>/gi
const ATTRIBUTE =
  /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
const ICON_RELS = new Set([
  "icon",
  "apple-touch-icon",
  "apple-touch-icon-precomposed",
])

type IconLink = {
  url: URL
  isFavicon: boolean
  isSvg: boolean
  isPng: boolean
  largestSize: number
}

function readAttributes(tagBody: string): Map<string, string> {
  const attributes = new Map<string, string>()
  for (const match of tagBody.matchAll(ATTRIBUTE)) {
    if (attributes.size >= MAX_ATTRIBUTES_PER_TAG) break
    const [, name = "", double, single, unquoted] = match
    const key = name.toLowerCase()
    // The first occurrence wins, as in browsers.
    if (!attributes.has(key)) {
      attributes.set(key, double ?? single ?? unquoted ?? "")
    }
  }
  return attributes
}

/** "16x16 32x32" → 32; "any" or nothing → 0. */
function largestSize(sizes: string): number {
  let largest = 0
  for (const [, width] of sizes.matchAll(/(\d{1,4})x\d{1,4}/gi)) {
    largest = Math.max(largest, Number(width))
  }
  return largest
}

function toIconLink(tagBody: string, pageUrl: URL): IconLink | null {
  const attributes = readAttributes(tagBody)
  const rels = (attributes.get("rel") ?? "").toLowerCase().split(/\s+/)
  if (!rels.some((rel) => ICON_RELS.has(rel))) return null

  const href = (attributes.get("href") ?? "").trim().replace(/&amp;/gi, "&")
  if (!href || href.length > MAX_HREF_LENGTH) return null
  if (!URL.canParse(href, pageUrl.href)) return null
  const url = new URL(href, pageUrl)
  // Rules out data:, javascript: and anything else we shouldn't fetch.
  if (url.protocol !== "https:" && url.protocol !== "http:") return null

  const type = (attributes.get("type") ?? "").toLowerCase()
  const path = url.pathname.toLowerCase()
  return {
    url,
    isFavicon: rels.includes("icon"),
    isSvg: type === "image/svg+xml" || path.endsWith(".svg"),
    isPng: type === "image/png" || path.endsWith(".png"),
    largestSize: largestSize(attributes.get("sizes") ?? ""),
  }
}

/**
 * Higher is better. Real favicons beat apple-touch-icons (large, made for
 * home screens); SVG scales to any size; a PNG or a declared size beats a
 * bare .ico, which is often a blurry 16px.
 */
function score(link: IconLink): number {
  let points = link.isFavicon ? 2 : 1
  if (link.isSvg) points += 4
  else if (link.isPng || link.largestSize > 0) points += 2
  if (link.largestSize >= 32) points += 1
  return points
}

/**
 * The icon URLs `html` links to, best first, resolved against `pageUrl` (the
 * final URL after redirects). Only http and https URLs are returned.
 */
export function findIconUrls(html: string, pageUrl: URL): URL[] {
  const links: IconLink[] = []
  let scanned = 0
  for (const [, tagBody = ""] of html.matchAll(LINK_TAG)) {
    if (++scanned > MAX_LINK_TAGS_SCANNED) break
    const link = toIconLink(tagBody, pageUrl)
    if (link) links.push(link)
  }
  // Array.prototype.sort is stable, so equal scores keep document order.
  return links.sort((a, b) => score(b) - score(a)).map((link) => link.url)
}
