import {
  type CreateFunnelInput,
  type Funnel,
  FUNNEL_MAX_PER_SITE,
} from "@workspace/contracts"
import {
  countFunnels,
  type Database,
  deleteFunnel,
  type FunnelRow,
  insertFunnel,
  listFunnels,
} from "@workspace/db"

import { AppError } from "../../../lib/errors"

export function toFunnel(row: FunnelRow): Funnel {
  return {
    id: row.id,
    name: row.name,
    steps: row.steps,
    createdAt: row.createdAt.toISOString(),
  }
}

/** The site's funnels, oldest first. */
export async function getFunnels(
  db: Database,
  siteId: string
): Promise<Funnel[]> {
  const rows = await listFunnels(db, { siteId, limit: FUNNEL_MAX_PER_SITE })
  return rows.map(toFunnel)
}

/**
 * Saves a funnel for the site, up to FUNNEL_MAX_PER_SITE. The count and the
 * insert are two statements, so two racing requests can end one over the
 * limit; it only bounds the list, so that's acceptable.
 */
export async function createFunnel(
  db: Database,
  { siteId, input }: { siteId: string; input: CreateFunnelInput }
): Promise<Funnel> {
  if ((await countFunnels(db, siteId)) >= FUNNEL_MAX_PER_SITE) {
    throw new AppError(
      "funnel_limit_reached",
      `A site can have ${FUNNEL_MAX_PER_SITE} funnels. Delete one to add another.`
    )
  }
  const row = await insertFunnel(db, { siteId, ...input })
  if (!row)
    throw new Error(`Saving a funnel for site ${siteId} returned no row`)
  return toFunnel(row)
}

/** Deletes one of the site's funnels; 404 when the site has no such funnel. */
export async function removeFunnel(
  db: Database,
  { siteId, funnelId }: { siteId: string; funnelId: string }
): Promise<void> {
  if (!(await deleteFunnel(db, { siteId, funnelId }))) {
    throw new AppError("not_found", "Funnel not found")
  }
}
