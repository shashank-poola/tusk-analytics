"use server"

import {
  createFunnelInputSchema,
  funnelIdSchema,
  siteIdSchema,
} from "@workspace/contracts"
import * as z from "zod"

import { createFunnel, deleteFunnel } from "./funnels.queries"

export type FunnelActionResult =
  { ok: true; funnelId: string } | { ok: false; error: string }

/**
 * Saves a funnel for the site. Server actions are public POST endpoints, so
 * the input is validated again here; the API checks ownership.
 */
export async function createFunnelAction(
  siteId: string,
  request: unknown
): Promise<FunnelActionResult> {
  const site = siteIdSchema.safeParse(siteId)
  const input = createFunnelInputSchema.safeParse(request)
  if (!site.success) return { ok: false, error: "Unknown site." }
  if (!input.success) {
    return { ok: false, error: z.prettifyError(input.error) }
  }
  const result = await createFunnel(site.data, input.data)
  return result.ok
    ? { ok: true, funnelId: result.data.id }
    : { ok: false, error: result.error.message }
}

/** Deletes one of the site's funnels. */
export async function deleteFunnelAction(
  siteId: string,
  funnelId: string
): Promise<{ ok: boolean; error?: string }> {
  const site = siteIdSchema.safeParse(siteId)
  const funnel = funnelIdSchema.safeParse(funnelId)
  if (!site.success || !funnel.success) {
    return { ok: false, error: "Unknown funnel." }
  }
  const result = await deleteFunnel(site.data, funnel.data)
  return result.ok ? { ok: true } : { ok: false, error: result.error.message }
}
