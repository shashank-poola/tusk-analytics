import {
  type CreateSiteInput,
  LOCALHOST,
  type Site,
} from "@workspace/contracts"
import {
  type Database,
  insertSite,
  listSitesByOwner,
  type Site as SiteRow,
} from "@workspace/db"

import { AppError } from "../../../lib/errors"

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
