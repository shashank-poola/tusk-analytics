import "server-only"

import {
  type CreateSiteInput,
  type InstallStatus,
  installStatusSchema,
  type Site,
  siteIdSchema,
  siteListResponseSchema,
  siteResponseSchema,
} from "@workspace/contracts"
import { cache } from "react"

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
 * someone else (the API answers 404 for both). Cached per request: the site
 * layout and page both need it.
 */
export const getSite = cache(async (siteId: string): Promise<Site | null> => {
  if (!siteIdSchema.safeParse(siteId).success) return null

  const result = await apiRequest(`/api/v1/sites/${siteId}`, siteResponseSchema)
  if (result.ok) return result.data.site
  if (result.status === 404) return null
  throw new Error(
    `Loading site ${siteId} failed (${result.error.code}): ${result.error.message}`
  )
})

export async function createSite(
  input: CreateSiteInput
): Promise<ApiResult<Site>> {
  const result = await apiRequest("/api/v1/sites", siteResponseSchema, {
    method: "POST",
    body: input,
  })
  return result.ok ? { ok: true, data: result.data.site } : result
}

/**
 * Whether the signed-in user's site has received its first event, or null
 * when the API couldn't say. For decisions that must not guess, like
 * where /dashboard sends someone. Cached per request.
 */
export const findInstallStatus = cache(
  async (siteId: string): Promise<InstallStatus | null> => {
    const result = await apiRequest(
      `/api/v1/sites/${siteId}/install-status`,
      installStatusSchema
    )
    if (result.ok) return result.data
    console.error(
      `Checking the install status of ${siteId} failed (${result.error.code}): ${result.error.message}`
    )
    return null
  }
)

/**
 * Like `findInstallStatus`, but an API error counts as "not yet": the
 * waiting banner keeps polling and recovers, instead of a secondary check
 * taking the whole page down.
 */
export async function getInstallStatus(siteId: string): Promise<InstallStatus> {
  return (
    (await findInstallStatus(siteId)) ?? {
      connected: false,
      firstEventAt: null,
    }
  )
}
