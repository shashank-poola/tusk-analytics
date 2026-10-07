import type {
  StatsBreakdownResponse,
  StatsTimeseriesResponse,
  StatsVisitor,
} from "@workspace/contracts"

// Sample data for the landing page demo of usetusk.dev. Fixed values, so
// the server and the browser render the same thing. Not real traffic.

export const DEMO_SITE = "usetusk.dev"

/** Daily visitors, Sep 8 – Oct 7 2026; the last day is still running. */
const DAILY_VISITORS = [
  182, 204, 196, 231, 268, 512, 433, 341, 297, 284, 266, 301, 322, 289, 274,
  318, 356, 401, 612, 498, 377, 342, 331, 356, 372, 398, 421, 446, 468, 214,
]
const PREVIOUS_VISITORS = [
  140, 151, 149, 162, 170, 166, 158, 171, 180, 176, 169, 188, 194, 201, 190,
  186, 199, 214, 221, 208, 202, 215, 229, 236, 224, 219, 241, 248, 252, 247,
]
/** The day's top source, for the peak icons. */
const TOP_SOURCES: Record<number, string> = {
  5: "hackernews",
  18: "producthunt",
  28: "x",
}

const START = Date.UTC(2026, 8, 8)
const DAY_MS = 86_400_000
const dayT = (offset: number, index: number) =>
  `${new Date(START + (index + offset) * DAY_MS).toISOString().slice(0, 10)}T00:00:00.000+00:00`
const pageviewsFor = (visitors: number) => Math.round(visitors * 2.6)

export const DEMO_TIMESERIES: StatsTimeseriesResponse = {
  interval: "day",
  inProgress: true,
  points: DAILY_VISITORS.map((visitors, index) => ({
    t: dayT(0, index),
    visitors,
    pageviews: pageviewsFor(visitors),
    topSource: TOP_SOURCES[index] ?? null,
  })),
  previousPoints: PREVIOUS_VISITORS.map((visitors, index) => ({
    t: dayT(-30, index),
    visitors,
    pageviews: pageviewsFor(visitors),
  })),
}

const sum = (values: number[]) => values.reduce((total, value) => total + value)

export const DEMO_TOTALS = {
  current: {
    visitors: sum(DAILY_VISITORS),
    pageviews: sum(DAILY_VISITORS.map(pageviewsFor)),
    bounceRate: 0.38,
    avgSessionSeconds: 134,
  },
  previous: {
    visitors: sum(PREVIOUS_VISITORS),
    pageviews: sum(PREVIOUS_VISITORS.map(pageviewsFor)),
    bounceRate: 0.44,
    avgSessionSeconds: 118,
  },
  online: 7,
}

type Rows = StatsBreakdownResponse["rows"]
const rows = (entries: [string | null, number][]): Rows =>
  entries.map(([key, visitors]) => ({
    key,
    visitors,
    pageviews: pageviewsFor(visitors),
  }))

/** One entry per demo tab: its breakdown, as the stats API returns it. */
export const DEMO_BREAKDOWNS = {
  referrer: {
    by: "source",
    rows: rows([
      ["direct", 2_814],
      ["google", 1_962],
      ["hackernews", 1_407],
      ["x", 1_133],
      ["producthunt", 869],
      ["github", 512],
      ["reddit", 388],
      ["chatgpt", 241],
      ["linkedin", 176],
      ["duckduckgo", 98],
    ]),
  },
  page: {
    by: "page",
    rows: rows([
      ["/", 6_208],
      ["/pricing", 2_131],
      ["/docs/install", 1_544],
      ["/blog/why-tusk", 1_012],
      ["/changelog", 688],
      ["/docs/goals", 455],
      ["/signup", 402],
      ["/blog/first-visitor", 317],
      ["/about", 196],
      ["/privacy", 81],
    ]),
  },
  entry_page: {
    by: "entry_page",
    rows: rows([
      ["/", 4_870],
      ["/blog/why-tusk", 1_402],
      ["/pricing", 1_118],
      ["/docs/install", 902],
      ["/changelog", 511],
      ["/blog/first-visitor", 288],
      ["/docs/goals", 197],
      ["/about", 102],
      ["/signup", 64],
      ["/privacy", 21],
    ]),
  },
  country: {
    by: "country",
    rows: rows([
      ["US", 3_412],
      ["IN", 1_788],
      ["GB", 1_021],
      ["DE", 864],
      ["CA", 655],
      ["FR", 512],
      ["NL", 344],
      ["BR", 298],
      ["AU", 241],
      ["SG", 167],
    ]),
  },
  city: {
    by: "city",
    rows: [
      ["San Francisco", "US", 902],
      ["Bengaluru", "IN", 744],
      ["London", "GB", 688],
      ["Berlin", "DE", 451],
      ["New York", "US", 430],
      ["Hyderabad", "IN", 402],
      ["Toronto", "CA", 377],
      ["Amsterdam", "NL", 251],
      ["Paris", "FR", 233],
      ["Singapore", "SG", 167],
    ].map(([key, country, visitors]) => ({
      key: String(key),
      country: String(country),
      visitors: Number(visitors),
      pageviews: pageviewsFor(Number(visitors)),
    })),
  },
  browser: {
    by: "browser",
    rows: rows([
      ["chrome", 5_802],
      ["safari", 1_911],
      ["firefox", 744],
      ["edge", 601],
      ["brave", 412],
      ["opera", 96],
      ["samsung-internet", 61],
    ]),
  },
  os: {
    by: "os",
    rows: rows([
      ["macos", 3_870],
      ["windows", 2_655],
      ["ios", 1_502],
      ["android", 1_133],
      ["linux", 467],
    ]),
  },
  device: {
    by: "device",
    rows: rows([
      ["desktop", 6_934],
      ["mobile", 2_510],
      ["tablet", 183],
    ]),
  },
} as const satisfies Record<string, StatsBreakdownResponse>

export type DemoTab = keyof typeof DEMO_BREAKDOWNS

/** The four cards and their tabs, as on the real dashboard. */
export const DEMO_CARDS: {
  label: string
  tabs: { id: DemoTab; label: string }[]
}[] = [
  {
    label: "Sources",
    tabs: [{ id: "referrer", label: "Referrer" }],
  },
  {
    label: "Pages",
    tabs: [
      { id: "page", label: "Page" },
      { id: "entry_page", label: "Entry page" },
    ],
  },
  {
    label: "Locations",
    tabs: [
      { id: "country", label: "Country" },
      { id: "city", label: "City" },
    ],
  },
  {
    label: "Devices",
    tabs: [
      { id: "browser", label: "Browser" },
      { id: "os", label: "OS" },
      { id: "device", label: "Device" },
    ],
  },
]

const visitor = (
  id: string,
  fields: Omit<StatsVisitor, "id" | "firstSeenAt" | "lastSeenAt" | "region"> & {
    minutesAgo: number
  }
): StatsVisitor => {
  const { minutesAgo, ...rest } = fields
  const lastSeen = new Date(DEMO_NOW.getTime() - minutesAgo * 60_000)
  return {
    id,
    region: null,
    firstSeenAt: new Date(lastSeen.getTime() - 3 * DAY_MS).toISOString(),
    lastSeenAt: lastSeen.toISOString(),
    ...rest,
  }
}

/** "Now" for the demo, so "5 minutes ago" never changes between renders. */
export const DEMO_NOW = new Date(Date.UTC(2026, 9, 7, 15, 0))

export const DEMO_VISITORS: StatsVisitor[] = [
  visitor("demo-visitor-1", {
    source: "hackernews",
    country: "US",
    city: "San Francisco",
    device: "desktop",
    browser: "chrome",
    os: "macos",
    pageviews: 9,
    sessions: 3,
    lastPage: "/pricing",
    activeDays: [false, true, false, true, true, false, true],
    minutesAgo: 1,
  }),
  visitor("demo-visitor-7", {
    source: "x",
    country: "IN",
    city: "Bengaluru",
    device: "mobile",
    browser: "safari",
    os: "ios",
    pageviews: 4,
    sessions: 2,
    lastPage: "/blog/why-tusk",
    activeDays: [false, false, false, false, true, false, true],
    minutesAgo: 4,
  }),
  visitor("demo-visitor-3", {
    source: "google",
    country: "GB",
    city: "London",
    device: "desktop",
    browser: "firefox",
    os: "linux",
    pageviews: 12,
    sessions: 5,
    lastPage: "/docs/install",
    activeDays: [true, true, false, true, true, true, true],
    minutesAgo: 11,
  }),
  visitor("demo-visitor-12", {
    source: "producthunt",
    country: "DE",
    city: "Berlin",
    device: "desktop",
    browser: "edge",
    os: "windows",
    pageviews: 3,
    sessions: 1,
    lastPage: "/",
    activeDays: [false, false, false, false, false, false, true],
    minutesAgo: 26,
  }),
  visitor("demo-visitor-5", {
    source: "direct",
    country: "CA",
    city: "Toronto",
    device: "tablet",
    browser: "safari",
    os: "ios",
    pageviews: 6,
    sessions: 2,
    lastPage: "/changelog",
    activeDays: [false, true, false, false, false, true, false],
    minutesAgo: 95,
  }),
]
