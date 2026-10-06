// Substrings (lowercase) that real browsers never send. A short own list
// instead of the isbot package: it covers the crawlers, monitors and HTTP
// libraries that hit analytics endpoints, and runs on every event.
const BOT_MARKERS = [
  "bot",
  "crawl",
  "spider",
  "slurp",
  "headless",
  "lighthouse",
  "pingdom",
  "uptime",
  "preview",
  "python-requests",
  "curl/",
  "wget/",
  "go-http",
  "axios/",
  "node-fetch",
  "facebookexternalhit",
  "whatsapp",
] as const

/** True for an empty user agent or one that names a bot or HTTP library. */
export function isBot(userAgent: string): boolean {
  if (!userAgent.trim()) return true
  const lower = userAgent.toLowerCase()
  return BOT_MARKERS.some((marker) => lower.includes(marker))
}
