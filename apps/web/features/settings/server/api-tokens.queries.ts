import "server-only"

import {
  type ApiToken,
  apiTokenIdSchema,
  apiTokenListResponseSchema,
  type CreateApiTokenInput,
  type CreatedApiTokenResponse,
  createdApiTokenResponseSchema,
} from "@workspace/contracts"
import * as z from "zod"

import { type ApiResult, apiRequest } from "@/lib/api-client"

/**
 * The user's account tokens, newest first; null when the API fails, so
 * the rest of Settings still renders.
 */
export async function findApiTokens(): Promise<ApiToken[] | null> {
  const result = await apiRequest("/api/v1/tokens", apiTokenListResponseSchema)
  if (result.ok) return result.data.tokens
  console.error(
    `Listing account tokens failed (${result.error.code}): ${result.error.message}`
  )
  return null
}

export function createApiToken(
  input: CreateApiTokenInput
): Promise<ApiResult<CreatedApiTokenResponse>> {
  return apiRequest("/api/v1/tokens", createdApiTokenResponseSchema, {
    method: "POST",
    body: input,
  })
}

export function revokeApiToken(tokenId: string): Promise<ApiResult<null>> {
  const id = apiTokenIdSchema.parse(tokenId)
  return apiRequest(`/api/v1/tokens/${id}`, z.null(), { method: "DELETE" })
}
