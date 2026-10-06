import type { CollectPayload } from "@workspace/contracts"
import { and, type Database, eq, events, lt, visitors } from "@workspace/db"
import type { BatchItem } from "drizzle-orm/batch"

import { isBot } from "./bot-filter"
import {
  MAX_CAMPAIGN_PARAMS_LENGTH,
  MAX_DERIVED_VALUE_LENGTH,
  MAX_HOSTNAME_LENGTH,
  MAX_OUTBOUND_URL_LENGTH,
  MAX_PATH_LENGTH,
  MAX_PLACE_NAME_LENGTH,
} from "./ingest.schema"
import { classifySource, isSiteHost, referrerHost } from "./referrer-source"
import { findSite } from "./site-cache"
import { parseUserAgent } from "./user-agent"

type DropReason = "bot" | "missing_origin" | "unknown_site" | "origin_mismatch"

type IngestResult =
  { status: "recorded" } | { status: "dropped"; reason: DropReason }

type IngestInput = {
  payload: CollectPayload
  /** The `Origin` request header. */
  origin: string | undefined
  userAgent: string | undefined
  /** `request.cf.country`; untyped on the raw request, so checked here. */
  country: unknown
  /** `request.cf.region` and `request.cf.city`, checked like `country`. */
  region: unknown
  city: unknown
  now: Date
}

function hostnameOf(origin: string): string | null {
  try {
    return new URL(origin).hostname
  } catch {
    // `Origin: null` (sandboxed frames, file: pages) and junk land here.
    return null
  }
}

/** Strips control characters, trims and caps a derived value; "" → null. */
function cleanValue(
  value: string | null,
  maxLength = MAX_DERIVED_VALUE_LENGTH
): string | null {
  const cleaned = value
    // eslint-disable-next-line no-control-regex
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength)
  return cleaned || null
}

/**
 * Marketing parameters kept for the campaign breakdown, in this order.
 * `ref` and `via` are what indie launch sites and newsletters append.
 */
const CAMPAIGN_PARAMS = [
  "ref",
  "via",
  "utm_source",
  "utm_medium",
  "utm_campaign",
] as const

/**
 * `?ref=` or `?via=`, cleaned. Affiliate and newsletter links sometimes put
 * an email there; a value with `@` is dropped, never stored.
 */
function referralTag(url: URL, name: "ref" | "via"): string | null {
  const value = cleanValue(url.searchParams.get(name))
  return value?.includes("@") ? null : value
}

/**
 * `ref=producthunt` or `utm_source=x&utm_medium=social`: the URL's
 * campaign parameters in a fixed order, each value cleaned and
 * URI-encoded so `&` and `=` inside one can't split it; null when none.
 */
function campaignParamsOf(url: URL): string | null {
  const pairs = CAMPAIGN_PARAMS.flatMap((name) => {
    const value =
      name === "ref" || name === "via"
        ? referralTag(url, name)
        : cleanValue(url.searchParams.get(name))
    return value ? [`${name}=${encodeURIComponent(value)}`] : []
  })
  const joined = pairs.join("&")
  return joined && joined.length <= MAX_CAMPAIGN_PARAMS_LENGTH ? joined : null
}

/** An outbound link as `host/path`: no scheme, query or fragment, which can hold tokens. */
function outboundUrlOf(href: string): string {
  const url = new URL(href)
  return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`.slice(
    0,
    MAX_OUTBOUND_URL_LENGTH
  )
}

/** A `request.cf` region or city name; null when missing or not a string. */
function cleanPlaceName(value: unknown): string | null {
  return typeof value === "string"
    ? cleanValue(value, MAX_PLACE_NAME_LENGTH)
    : null
}

/**
 * Records one tracker event, or says why it was dropped. Everything stored
 * beyond the ids is derived here from the URL, the headers and
 * `request.cf`; the tracker's word is taken only for what it alone knows.
 */
export async function ingestEvent(
  db: Database,
  { payload, origin, userAgent = "", country, region, city, now }: IngestInput
): Promise<IngestResult> {
  if (isBot(userAgent)) return { status: "dropped", reason: "bot" }
  const originHost = origin ? hostnameOf(origin) : null
  if (!originHost) return { status: "dropped", reason: "missing_origin" }

  const site = await findSite(db, payload.siteId, now.getTime())
  if (!site) return { status: "dropped", reason: "unknown_site" }
  if (!isSiteHost(originHost, site.domain)) {
    return { status: "dropped", reason: "origin_mismatch" }
  }

  const url = new URL(payload.url)
  const path = url.pathname.slice(0, MAX_PATH_LENGTH)
  const hostname = url.hostname.slice(0, MAX_HOSTNAME_LENGTH)
  const visitorKey = { siteId: site.id, visitorId: payload.visitorId }

  if (payload.name !== "pageview") {
    // One row: a click or a goal needs no visitor write, source or
    // location; filters and funnels reach those through its session.
    // A goal is stored under its own name (never pageview or outbound).
    await writeOrThrow(db, site.id, [
      db.insert(events).values({
        ...visitorKey,
        sessionId: payload.sessionId,
        path,
        hostname,
        createdAt: now,
        ...(payload.name === "outbound"
          ? { name: "outbound", props: { url: outboundUrlOf(payload.href) } }
          : { name: payload.goal }),
      }),
    ])
    return { status: "recorded" }
  }

  const utmSource = cleanValue(url.searchParams.get("utm_source"))
  const utmMedium = cleanValue(url.searchParams.get("utm_medium"))
  const utmCampaign = cleanValue(url.searchParams.get("utm_campaign"))
  const referrer = cleanValue(referrerHost(payload.referrer, site.domain))
  const tagged = utmSource ?? referralTag(url, "ref") ?? referralTag(url, "via")
  const source = classifySource({ tagged, referrer })
  const validCountry =
    typeof country === "string" && /^[A-Z]{2}$/.test(country) ? country : null
  const { browser, os, device } = parseUserAgent(userAgent)

  // First touch is written once and never overwritten.
  const insertVisitor = db
    .insert(visitors)
    .values({
      ...visitorKey,
      firstSource: source,
      firstReferrer: referrer,
      firstUtmSource: utmSource,
      firstUtmMedium: utmMedium,
      firstUtmCampaign: utmCampaign,
      firstLandingPath: path,
      firstCountry: validCountry,
      firstSeenAt: now,
      lastSeenAt: now,
    })
    .onConflictDoNothing({ target: [visitors.siteId, visitors.visitorId] })
  const insertEvent = db.insert(events).values({
    ...visitorKey,
    sessionId: payload.sessionId,
    name: payload.name,
    path,
    hostname,
    referrer,
    source,
    utmSource,
    utmMedium,
    utmCampaign,
    campaignParams: campaignParamsOf(url),
    country: validCountry,
    region: cleanPlaceName(region),
    city: cleanPlaceName(city),
    browser,
    os,
    device,
    createdAt: now,
  })

  // Once per visit rather than per event: D1 bills per row written. The
  // `lt` skips the row a first visit's insert just wrote with this time.
  const touchVisitor = db
    .update(visitors)
    .set({ lastSeenAt: now })
    .where(
      and(
        eq(visitors.siteId, site.id),
        eq(visitors.visitorId, payload.visitorId),
        lt(visitors.lastSeenAt, now)
      )
    )

  await writeOrThrow(
    db,
    site.id,
    payload.newSession
      ? [insertVisitor, insertEvent, touchVisitor]
      : [insertVisitor, insertEvent]
  )
  return { status: "recorded" }
}

type Write = BatchItem<"sqlite">

/** One atomic batch; a failure names the site but none of the values. */
async function writeOrThrow(
  db: Database,
  siteId: string,
  [first, ...rest]: [Write, ...Write[]]
): Promise<void> {
  try {
    await db.batch([first, ...rest])
  } catch (error) {
    // Drizzle's message embeds the bound params (visitor id, path, UTM
    // values), and the error handler logs what it gets. Keep only D1's cause.
    throw new Error(`Writing an event for site ${siteId} failed`, {
      cause: error instanceof Error ? error.cause : undefined,
    })
  }
}
