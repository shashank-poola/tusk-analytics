import "server-only"

import {
  type CreateSiteInput,
  type Site,
  siteIdSchema,
  siteListResponseSchema,
  siteResponseSchema,
} from "@workspace/contracts"

import { type ApiResult, apiRequest } from "@/lib/api-client"

/** The signed-in user's sites, newest first. */
export async function listSites({ limit }: { limit: number }): Promise<Site[]> {
  const result = await apiRequest(
    `/api/v1/sites?limit=${limit}`,
    siteListResponseSchema
  )
  if (!result.ok) {
    throw new Error(
      `Listing sites failed (${result.error.code}): ${result.error.message}`
    )
  }
  return result.data.sites
}

/**
 * The signed-in user's site, or null when it doesn't exist or belongs to
 * someone else (the API answers 404 for both).
 */
export async function getSite(siteId: string): Promise<Site | null> {
  if (!siteIdSchema.safeParse(siteId).success) return null

  const result = await apiRequest(`/api/v1/sites/${siteId}`, siteResponseSchema)
  if (result.ok) return result.data.site
  if (result.status === 404) return null
  throw new Error(
    `Loading site ${siteId} failed (${result.error.code}): ${result.error.message}`
  )
}

export async function createSite(
  input: CreateSiteInput
): Promise<ApiResult<Site>> {
  const result = await apiRequest("/api/v1/sites", siteResponseSchema, {
    method: "POST",
    body: input,
  })
  return result.ok ? { ok: true, data: result.data.site } : result
}
