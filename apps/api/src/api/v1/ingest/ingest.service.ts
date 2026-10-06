import type { CollectPayload } from "@workspace/contracts"
import { and, type Database, eq, events, lt, visitors } from "@workspace/db"

import { isBot } from "./bot-filter"
import { MAX_DERIVED_VALUE_LENGTH, MAX_PATH_LENGTH } from "./ingest.schema"
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
function cleanValue(value: string | null): string | null {
  const cleaned = value
    // eslint-disable-next-line no-control-regex
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, MAX_DERIVED_VALUE_LENGTH)
  return cleaned || null
}

/**
 * Records one tracker event, or says why it was dropped. Everything stored
 * beyond the ids is derived here from the URL, the headers and
 * `request.cf`; the tracker's word is taken only for what it alone knows.
 */
export async function ingestEvent(
  db: Database,
  { payload, origin, userAgent = "", country, now }: IngestInput
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
  const utmSource = cleanValue(url.searchParams.get("utm_source"))
  const utmMedium = cleanValue(url.searchParams.get("utm_medium"))
  const utmCampaign = cleanValue(url.searchParams.get("utm_campaign"))
  const referrer = cleanValue(referrerHost(payload.referrer, site.domain))
  const source = classifySource({ utmSource, referrer })
  const path = url.pathname.slice(0, MAX_PATH_LENGTH)
  const validCountry =
    typeof country === "string" && /^[A-Z]{2}$/.test(country) ? country : null
  const { browser, os, device } = parseUserAgent(userAgent)

  const visitorKey = { siteId: site.id, visitorId: payload.visitorId }
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
    referrer,
    source,
    utmSource,
    utmMedium,
    utmCampaign,
    country: validCountry,
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

  try {
    await (payload.newSession
      ? db.batch([insertVisitor, insertEvent, touchVisitor])
      : db.batch([insertVisitor, insertEvent]))
  } catch (error) {
    // Drizzle's message embeds the bound params (visitor id, path, UTM
    // values), and the error handler logs what it gets. Keep only D1's cause.
    throw new Error(`Writing an event for site ${site.id} failed`, {
      cause: error instanceof Error ? error.cause : undefined,
    })
  }
  return { status: "recorded" }
}
