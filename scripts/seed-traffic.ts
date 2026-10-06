/**
 * The traffic model behind `bun run db:seed`: realistic, deterministic
 * sessions for one site. It only generates data; seed-events.ts writes it.
 */
import { utcOffsetMinutes } from "../apps/api/src/api/v1/stats/stats.range"

const DAY_MS = 24 * 60 * 60 * 1000

/** mulberry32: a small seeded PRNG, so the same --seed gives the same data. */
function createRandom(seed: number) {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const pick = <T>(weighted: readonly (readonly [T, number])[]): T => {
    const total = weighted.reduce((sum, [, weight]) => sum + weight, 0)
    let roll = next() * total
    for (const [value, weight] of weighted) {
      roll -= weight
      if (roll < 0) return value
    }
    // Only reached through floating-point rounding: use the last option.
    const last = weighted.at(-1)
    if (!last) throw new Error("pick() needs at least one option")
    return last[0]
  }
  const uuid = () => {
    const hex = Array.from({ length: 32 }, () =>
      Math.floor(next() * 16).toString(16)
    )
    hex[12] = "4"
    hex[16] = ((Number.parseInt(hex[16] ?? "0", 16) & 0x3) | 0x8).toString(16)
    const s = hex.join("")
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
  }
  return { next, pick, uuid }
}

type Source = {
  source: string
  referrer: string | null
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

// Sources as ingest stores them (referrer host or lowercased utm_source →
// source, see apps/api/src/api/v1/ingest/referrer-source.ts), covering every
// channel in packages/db/src/queries/channels.ts.
const SOURCES: readonly (readonly [Source, number])[] = [
  [{ source: "google", referrer: "www.google.com" }, 30],
  [{ source: "direct", referrer: null }, 22],
  [{ source: "x", referrer: "t.co" }, 10],
  [{ source: "github", referrer: "github.com" }, 9],
  [{ source: "hackernews", referrer: "news.ycombinator.com" }, 8],
  [{ source: "reddit", referrer: "www.reddit.com" }, 4],
  [{ source: "chatgpt", referrer: "chatgpt.com" }, 4],
  [{ source: "perplexity", referrer: "www.perplexity.ai" }, 2],
  [{ source: "bing", referrer: "www.bing.com" }, 3],
  [{ source: "www.indiehackers.com", referrer: "www.indiehackers.com" }, 3],
  [
    {
      source: "google",
      referrer: "www.google.com",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "brand-search",
    },
    4,
  ],
  [
    {
      source: "newsletter",
      referrer: null,
      utmSource: "newsletter",
      utmMedium: "email",
      utmCampaign: "october-digest",
    },
    3,
  ],
  [
    {
      source: "producthunt",
      referrer: "www.producthunt.com",
      utmSource: "producthunt",
      utmMedium: "social",
      utmCampaign: "launch-week",
    },
    3,
  ],
]

type Location = { country: string; region: string; city: string }

const LOCATIONS: readonly (readonly [Location, number])[] = [
  [{ country: "US", region: "California", city: "San Francisco" }, 12],
  [{ country: "US", region: "California", city: "Los Angeles" }, 6],
  [{ country: "US", region: "New York", city: "New York" }, 10],
  [{ country: "US", region: "Texas", city: "Austin" }, 7],
  [{ country: "IN", region: "Karnataka", city: "Bengaluru" }, 12],
  [{ country: "IN", region: "Maharashtra", city: "Mumbai" }, 8],
  [{ country: "IN", region: "Delhi", city: "New Delhi" }, 5],
  [{ country: "DE", region: "Berlin", city: "Berlin" }, 8],
  [{ country: "DE", region: "Bavaria", city: "Munich" }, 7],
  [{ country: "GB", region: "England", city: "London" }, 11],
  [{ country: "GB", region: "Scotland", city: "Edinburgh" }, 4],
  [{ country: "BR", region: "Sao Paulo", city: "São Paulo" }, 7],
  [{ country: "BR", region: "Rio de Janeiro", city: "Rio de Janeiro" }, 3],
]

type Client = { device: string; os: string; browser: string }
const CLIENTS: readonly (readonly [Client, number])[] = [
  [{ device: "desktop", os: "Windows", browser: "Chrome" }, 26],
  [{ device: "desktop", os: "Windows", browser: "Edge" }, 7],
  [{ device: "desktop", os: "Windows", browser: "Firefox" }, 2],
  [{ device: "desktop", os: "macOS", browser: "Chrome" }, 12],
  [{ device: "desktop", os: "macOS", browser: "Safari" }, 8],
  [{ device: "desktop", os: "Linux", browser: "Firefox" }, 5],
  [{ device: "mobile", os: "iOS", browser: "Safari" }, 16],
  [{ device: "mobile", os: "Android", browser: "Chrome" }, 18],
  [{ device: "tablet", os: "iOS", browser: "Safari" }, 4],
  [{ device: "tablet", os: "Android", browser: "Chrome" }, 2],
]

const BLOG = ["/blog/launch-week", "/blog/indie-analytics", "/blog/attribution"]
const DOCS = ["/docs/install", "/docs/api", "/docs/revenue"]
const PAGES = [
  ["/", 30],
  ["/pricing", 20],
  ...BLOG.map((path) => [path, 10] as const),
  ...DOCS.map((path) => [path, 7] as const),
] as const
const LANDING_BY_SOURCE: Record<
  string,
  readonly (readonly [string, number])[]
> = {
  google: [
    ["/", 2],
    ...BLOG.map((p) => [p, 2] as const),
    ...DOCS.map((p) => [p, 2] as const),
  ],
  x: BLOG.map((p) => [p, 1] as const),
  hackernews: [["/", 1], ...BLOG.map((p) => [p, 2] as const)],
  github: [["/", 1], ...DOCS.map((p) => [p, 2] as const)],
  direct: [
    ["/", 4],
    ["/pricing", 1],
  ],
}

// Local-time traffic shape: quiet nights, busy working hours, light weekends.
const HOUR_WEIGHT = [
  0.15, 0.1, 0.08, 0.08, 0.1, 0.15, 0.3, 0.5, 0.75, 0.95, 1, 1, 0.95, 1, 1,
  0.95, 0.9, 0.8, 0.7, 0.65, 0.6, 0.5, 0.35, 0.25,
]
const WEEKDAY_WEIGHT = [0.55, 1, 1, 1, 0.95, 0.85, 0.6] // Sunday first
const RETURNING_SHARE = 0.3
const BOUNCE_SHARE = 0.42

type Visitor = { id: string; location: Location; client: Client }

export type TrafficOptions = { events: number; days: number; seed: number }

export type Session = {
  id: string
  visitor: Visitor
  source: Source
  /** In order; the first is the landing page. */
  pageviews: { path: string; at: number }[]
}

/**
 * Exactly `events` pageviews over the `days` before `end`, in sessions
 * sorted by start time so each visitor's first session is their first touch.
 */
export function generateSessions(
  options: TrafficOptions,
  timeZone: string,
  end: number
): Session[] {
  const random = createRandom(options.seed)
  const start = end - options.days * DAY_MS
  const offset = utcOffsetMinutes(timeZone, new Date(end)) * 60_000
  const visitors: Visitor[] = []
  const sessions: Session[] = []
  let remaining = options.events

  while (remaining > 0) {
    // Rejection sampling against the hour and weekday shape, with growth
    // over the period.
    let at: number
    for (;;) {
      at = start + random.next() * (end - start)
      const local = new Date(at + offset)
      const growth = 0.6 + (0.4 * (at - start)) / (end - start)
      const weight =
        (HOUR_WEIGHT[local.getUTCHours()] ?? 0) *
        (WEEKDAY_WEIGHT[local.getUTCDay()] ?? 0) *
        growth
      if (random.next() < weight) break
    }

    const returning =
      visitors.length > 0 && random.next() < RETURNING_SHARE
        ? visitors[Math.floor(random.next() * visitors.length)]
        : undefined
    const visitor: Visitor = returning ?? {
      id: random.uuid(),
      location: random.pick(LOCATIONS),
      client: random.pick(CLIENTS),
    }
    if (!returning) visitors.push(visitor)

    const source = random.pick(SOURCES)
    const length =
      random.next() < BOUNCE_SHARE
        ? 1
        : 2 + Math.floor(-Math.log(1 - random.next()) * 2)
    const paths = [random.pick(LANDING_BY_SOURCE[source.source] ?? PAGES)]
    while (paths.length < Math.min(length, remaining)) {
      paths.push(random.pick(PAGES))
    }
    remaining -= paths.length

    // 20 s to 4 min between pages, never past the end of the period.
    let time = Math.floor(at)
    const pageviews = paths.map((path) => {
      const pageview = { path, at: Math.min(time, end - 1) }
      time += 20_000 + Math.floor(random.next() * 220_000)
      return pageview
    })
    sessions.push({ id: random.uuid(), visitor, source, pageviews })
  }
  return sessions.sort(
    (a, b) => (a.pageviews[0]?.at ?? 0) - (b.pageviews[0]?.at ?? 0)
  )
}
