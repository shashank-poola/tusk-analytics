import { and, count, desc, eq, isNull, lt, or } from "drizzle-orm"

import type { Database } from "../client"
import { apiTokens } from "../schema/api-tokens"
import { type User, user } from "../schema/auth"

/** What Settings shows for a token: never its hash. */
export type ApiTokenSummary = {
  id: string
  name: string
  prefix: string
  lastUsedAt: Date | null
  createdAt: Date
}

const SUMMARY = {
  id: apiTokens.id,
  name: apiTokens.name,
  prefix: apiTokens.prefix,
  lastUsedAt: apiTokens.lastUsedAt,
  createdAt: apiTokens.createdAt,
}

/** The user's tokens, newest first (`api_tokens_user_idx`). */
export function listApiTokens(
  db: Database,
  userId: string
): Promise<ApiTokenSummary[]> {
  return db
    .select(SUMMARY)
    .from(apiTokens)
    .where(eq(apiTokens.userId, userId))
    .orderBy(desc(apiTokens.createdAt))
}

export async function countApiTokens(
  db: Database,
  userId: string
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(apiTokens)
    .where(eq(apiTokens.userId, userId))
  return row?.total ?? 0
}

export async function insertApiToken(
  db: Database,
  input: { userId: string; name: string; tokenHash: string; prefix: string }
): Promise<ApiTokenSummary> {
  const [row] = await db.insert(apiTokens).values(input).returning(SUMMARY)
  if (!row) throw new Error("Inserting an API token returned no row")
  return row
}

/** Deletes the user's token; false when it isn't theirs or doesn't exist. */
export async function deleteApiToken(
  db: Database,
  userId: string,
  tokenId: string
): Promise<boolean> {
  const deleted = await db
    .delete(apiTokens)
    .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, userId)))
    .returning({ id: apiTokens.id })
  return deleted.length > 0
}

/** The token with this hash and its owner, via `api_tokens_hash_uq`. */
export async function findApiTokenOwner(
  db: Database,
  tokenHash: string
): Promise<{ tokenId: string; user: User } | undefined> {
  const [row] = await db
    .select({ tokenId: apiTokens.id, user })
    .from(apiTokens)
    .innerJoin(user, eq(user.id, apiTokens.userId))
    .where(eq(apiTokens.tokenHash, tokenHash))
    .limit(1)
  return row
}

const TOUCH_INTERVAL_MS = 60 * 60 * 1000

/**
 * Records that the token was used, at most once an hour: the WHERE skips
 * the write when it was already marked within the hour.
 */
export async function touchApiToken(
  db: Database,
  tokenId: string,
  now: Date
): Promise<void> {
  await db
    .update(apiTokens)
    .set({ lastUsedAt: now })
    .where(
      and(
        eq(apiTokens.id, tokenId),
        or(
          isNull(apiTokens.lastUsedAt),
          lt(apiTokens.lastUsedAt, new Date(now.getTime() - TOUCH_INTERVAL_MS))
        )
      )
    )
}
