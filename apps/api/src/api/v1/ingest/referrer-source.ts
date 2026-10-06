import { sourceForHost } from "@workspace/contracts"

const DIRECT = "direct"

/** True for the site's own hosts: exactly `domain` or `www.<domain>`. */
export function isSiteHost(host: string, domain: string): boolean {
  return host === domain || host === `www.${domain}`
}

/**
 * The referrer's hostname, or null when there is none, it isn't an http(s)
 * URL, or it is the site itself (`domain` or `www.domain`), which is
 * navigation inside the site rather than a source.
 */
export function referrerHost(referrer: string, domain: string): string | null {
  if (!referrer) return null
  let url: URL
  try {
    url = new URL(referrer)
  } catch {
    return null
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null
  return isSiteHost(url.hostname, domain) ? null : url.hostname
}

/**
 * Where the visit came from: the URL's own tag (`utm_source`, else `ref`,
 * else `via`) when present, lowercased, else the referrer normalized
 * through the shared referrer map (`t.co` → `x`), else the referrer's
 * hostname, else `direct`.
 */
export function classifySource({
  tagged,
  referrer,
}: {
  tagged: string | null
  referrer: string | null
}): string {
  const tag = tagged?.toLowerCase()
  if (tag) return tag
  if (!referrer) return DIRECT
  return sourceForHost(referrer) ?? referrer
}
