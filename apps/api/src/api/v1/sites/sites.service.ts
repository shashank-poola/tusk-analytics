import {
  type CreateSiteInput,
  type InstallStatus,
  LOCALHOST,
  type Site,
} from "@workspace/contracts"
import {
  asc,
  type Database,
  eq,
  events,
  insertSite,
  listSitesByOwner,
  type Site as SiteRow,
  sites,
} from "@workspace/db"

import { AppError } from "../../../lib/errors"

/**
 * Keeps one account from creating sites without bound. Two concurrent
 * creates can both pass the count and end one over; that's acceptable.
 */
export const MAX_SITES_PER_USER = 25

export function toSite(row: SiteRow): Site {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    timezone: row.timezone,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listSites(
  db: Database,
  { ownerId, limit }: { ownerId: string; limit: number }
): Promise<Site[]> {
  const rows = await listSitesByOwner(db, { ownerId, limit })
  return rows.map(toSite)
}

export async function createSite(
  db: Database,
  {
    ownerId,
    input,
    allowLocalhost,
  }: { ownerId: string; input: CreateSiteInput; allowLocalhost: boolean }
): Promise<Site> {
  if (input.domain === LOCALHOST && !allowLocalhost) {
    throw new AppError(
      "bad_request",
      "localhost only works in development. Enter your site's public domain, like myapp.com."
    )
  }

  // Counted through sites_owner_idx.
  const siteCount = await db.$count(sites, eq(sites.ownerId, ownerId))
  if (siteCount >= MAX_SITES_PER_USER) {
    throw new AppError(
      "site_limit_reached",
      `You can add up to ${MAX_SITES_PER_USER} sites per account. Contact us if you need more.`
    )
  }

  // ownerId goes last so nothing from the request can ever override it.
  const row = await insertSite(db, { ...input, ownerId })
  if (!row) {
    throw new AppError(
      "site_already_exists",
      `You already added ${input.domain}. Pick it from your dashboard instead.`
    )
  }
  return toSite(row)
}

/**
 * Whether the site has received any event. The caller must check that the
 * signed-in user owns `siteId`. Reads one row through events_site_time_idx
 * (site_id, created_at).
 */
export async function getInstallStatus(
  db: Database,
  siteId: string
): Promise<InstallStatus> {
  const [first] = await db
    .select({ createdAt: events.createdAt })
    .from(events)
    .where(eq(events.siteId, siteId))
    .orderBy(asc(events.createdAt))
    .limit(1)
  return first
    ? { connected: true, firstEventAt: first.createdAt.toISOString() }
    : { connected: false, firstEventAt: null }
}
