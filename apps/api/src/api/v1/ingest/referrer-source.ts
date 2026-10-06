const DIRECT = "direct"

/**
 * Referrer hostnames grouped into the channels the dashboard shows. A host
 * matches itself and every subdomain (`l.facebook.com` → `facebook`).
 */
const SOURCE_BY_HOST: Record<string, string> = {
  "bing.com": "bing",
  "duckduckgo.com": "duckduckgo",
  "x.com": "x",
  "twitter.com": "x",
  "t.co": "x",
  "facebook.com": "facebook",
  "linkedin.com": "linkedin",
  "lnkd.in": "linkedin",
  "reddit.com": "reddit",
  "news.ycombinator.com": "hackernews",
  "github.com": "github",
  "producthunt.com": "producthunt",
  "chatgpt.com": "chatgpt",
  "chat.openai.com": "chatgpt",
  "perplexity.ai": "perplexity",
}

// Google search runs on a domain per country: google.com, google.co.uk,
// google.com.au, google.de...
const GOOGLE = /(?:^|\.)google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/

/** `host` and its parent domains, longest first: a.b.com, b.com, com. */
function hostAndParents(host: string): string[] {
  const labels = host.split(".")
  return labels.map((_, index) => labels.slice(index).join("."))
}

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
 * Where the visit came from: `utm_source` when present, else the referrer
 * mapped to a known channel, else the referrer's hostname, else `direct`.
 */
export function classifySource({
  utmSource,
  referrer,
}: {
  utmSource: string | null
  referrer: string | null
}): string {
  const tagged = utmSource?.toLowerCase()
  if (tagged) return tagged
  if (!referrer) return DIRECT
  if (GOOGLE.test(referrer)) return "google"
  for (const host of hostAndParents(referrer)) {
    const source = SOURCE_BY_HOST[host]
    if (source) return source
  }
  return referrer
}
