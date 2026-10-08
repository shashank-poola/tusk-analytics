"use server"

import {
  apiTokenIdSchema,
  createApiTokenInputSchema,
} from "@workspace/contracts"

import { createApiToken, revokeApiToken } from "./api-tokens.queries"

export type CreateApiTokenResult =
  { ok: true; secret: string } | { ok: false; error: string }

/**
 * Creates an account token and returns its secret, which is shown once.
 * Server actions are public POST endpoints, so the input is validated
 * again here; the API ties the token to the signed-in user.
 */
export async function createApiTokenAction(
  request: unknown
): Promise<CreateApiTokenResult> {
  const input = createApiTokenInputSchema.safeParse(request)
  if (!input.success) {
    return {
      ok: false,
      error: input.error.issues[0]?.message ?? "Check the token's name.",
    }
  }
  const result = await createApiToken(input.data)
  if (!result.ok) return { ok: false, error: result.error.message }
  return { ok: true, secret: result.data.secret }
}

/** Revokes one of the user's tokens; it stops working at once. */
export async function revokeApiTokenAction(
  tokenId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = apiTokenIdSchema.safeParse(tokenId)
  if (!id.success) return { ok: false, error: "Unknown token." }
  const result = await revokeApiToken(id.data)
  if (!result.ok) return { ok: false, error: result.error.message }
  return { ok: true }
}
