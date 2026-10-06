"use server"

import { siteIdSchema } from "@workspace/contracts"

import { getLiveVisitors } from "./analytics.queries"

/**
 * Polled by the Online counter. Server actions are public POST endpoints, so
 * the id is validated before it goes into the API path; the API checks that
 * the signed-in user owns the site.
 */
export async function checkLiveVisitors(siteId: string): Promise<number> {
  const id = siteIdSchema.safeParse(siteId)
  if (!id.success) throw new Error("checkLiveVisitors needs a valid site id")
  const { visitors } = await getLiveVisitors(id.data)
  return visitors
}
