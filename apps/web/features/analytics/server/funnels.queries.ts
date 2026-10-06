import "server-only"

import {
  type CreateFunnelInput,
  type Funnel,
  funnelIdSchema,
  funnelListResponseSchema,
  funnelResponseSchema,
  siteIdSchema,
} from "@workspace/contracts"
import * as z from "zod"

import { type ApiResult, apiRequest } from "@/lib/api-client"

const funnelsPath = (siteId: string) =>
  `/api/v1/sites/${siteIdSchema.parse(siteId)}/funnels` as const

/** The site's funnels, oldest first. */
export async function listFunnels(siteId: string): Promise<Funnel[]> {
  const result = await apiRequest(funnelsPath(siteId), funnelListResponseSchema)
  if (!result.ok) {
    throw new Error(
      `Listing funnels of ${siteId} failed (${result.error.code}): ${result.error.message}`
    )
  }
  return result.data.funnels
}

export async function createFunnel(
  siteId: string,
  input: CreateFunnelInput
): Promise<ApiResult<Funnel>> {
  const result = await apiRequest(funnelsPath(siteId), funnelResponseSchema, {
    method: "POST",
    body: input,
  })
  return result.ok ? { ok: true, data: result.data.funnel } : result
}

export async function deleteFunnel(
  siteId: string,
  funnelId: string
): Promise<ApiResult<null>> {
  const id = funnelIdSchema.parse(funnelId)
  return apiRequest(`${funnelsPath(siteId)}/${id}`, z.null(), {
    method: "DELETE",
  })
}
