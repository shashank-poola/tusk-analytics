import {
  type ApiToken,
  type CreatedApiTokenResponse,
  MAX_API_TOKENS_PER_USER,
} from "@workspace/contracts"
import {
  type ApiTokenSummary,
  countApiTokens,
  type Database,
  deleteApiToken,
  insertApiToken,
  listApiTokens,
} from "@workspace/db"

import {
  apiTokenPrefix,
  generateApiTokenSecret,
  hashApiToken,
} from "../../../lib/api-token"
import { AppError } from "../../../lib/errors"

function toApiToken(row: ApiTokenSummary): ApiToken {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

/** The user's account tokens, newest first. */
export async function getApiTokens(
  db: Database,
  userId: string
): Promise<ApiToken[]> {
  const rows = await listApiTokens(db, userId)
  return rows.map(toApiToken)
}

/**
 * Creates a token and returns its secret, the only time it leaves the
 * server: only its hash is stored. The count and the insert are two
 * statements, so two racing requests can end one over the limit; it only
 * bounds the list, so that's acceptable.
 */
export async function createApiToken(
  db: Database,
  { userId, name }: { userId: string; name: string }
): Promise<CreatedApiTokenResponse> {
  if ((await countApiTokens(db, userId)) >= MAX_API_TOKENS_PER_USER) {
    throw new AppError(
      "token_limit_reached",
      `You can have ${MAX_API_TOKENS_PER_USER} tokens. Revoke one to create another.`
    )
  }
  const secret = generateApiTokenSecret()
  const row = await insertApiToken(db, {
    userId,
    name,
    tokenHash: await hashApiToken(secret),
    prefix: apiTokenPrefix(secret),
  })
  return { token: toApiToken(row), secret }
}

/** Revokes one of the user's tokens; 404 when they have no such token. */
export async function revokeApiToken(
  db: Database,
  { userId, tokenId }: { userId: string; tokenId: string }
): Promise<void> {
  if (!(await deleteApiToken(db, userId, tokenId))) {
    throw new AppError("not_found", "Token not found")
  }
}
