type KnownReferrer = {
  /** Stored in `events.source`; also the icon file name. */
  source: string
  /** Shown on the dashboard. */
  name: string
}

/**
 * Referrer hostnames ingest normalizes to one source, so `t.co` is stored as
 * `x`. A host matches itself and every subdomain (`l.facebook.com`). The
 * dashboard shows `/icons/referrers/<source>.svg` for these. Sources are
 * stored data: add hosts freely, never rename a source.
 */
export const REFERRERS: Record<string, KnownReferrer> = {
  "google.com": { source: "google", name: "Google" },
  "bing.com": { source: "bing", name: "Bing" },
  "duckduckgo.com": { source: "duckduckgo", name: "DuckDuckGo" },
  "x.com": { source: "x", name: "X" },
  "twitter.com": { source: "x", name: "X" },
  "t.co": { source: "x", name: "X" },
  "facebook.com": { source: "facebook", name: "Facebook" },
  "instagram.com": { source: "instagram", name: "Instagram" },
  "linkedin.com": { source: "linkedin", name: "LinkedIn" },
  "lnkd.in": { source: "linkedin", name: "LinkedIn" },
  "reddit.com": { source: "reddit", name: "Reddit" },
  "youtube.com": { source: "youtube", name: "YouTube" },
  "youtu.be": { source: "youtube", name: "YouTube" },
  "news.ycombinator.com": { source: "hackernews", name: "Hacker News" },
  "producthunt.com": { source: "producthunt", name: "Product Hunt" },
  "github.com": { source: "github", name: "GitHub" },
  "t.me": { source: "telegram", name: "Telegram" },
  "telegram.org": { source: "telegram", name: "Telegram" },
  "whatsapp.com": { source: "whatsapp", name: "WhatsApp" },
  "wa.me": { source: "whatsapp", name: "WhatsApp" },
  "chatgpt.com": { source: "chatgpt", name: "ChatGPT" },
  "chat.openai.com": { source: "chatgpt", name: "ChatGPT" },
  "perplexity.ai": { source: "perplexity", name: "Perplexity" },
}

// Google search runs on a domain per country: google.com, google.co.uk,
// google.com.au, google.de...
const GOOGLE = /(?:^|\.)google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/

const NAME_BY_SOURCE = new Map(
  Object.values(REFERRERS).map(({ source, name }) => [source, name])
)

/** The known source for a referrer hostname, or null. */
export function sourceForHost(host: string): string | null {
  if (GOOGLE.test(host)) return "google"
  const labels = host.split(".")
  for (let index = 0; index < labels.length; index++) {
    const candidate = labels.slice(index).join(".")
    // hasOwn: a host named "constructor" must not hit Object.prototype.
    const known = Object.hasOwn(REFERRERS, candidate)
      ? REFERRERS[candidate]
      : undefined
    if (known) return known.source
  }
  return null
}

/** "hackernews" → "Hacker News"; undefined for a source not in the map. */
export function knownSourceName(source: string): string | undefined {
  return NAME_BY_SOURCE.get(source)
}
