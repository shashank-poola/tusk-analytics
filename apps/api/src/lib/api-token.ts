import { API_TOKEN_PREFIX } from "@workspace/contracts"
import {
  createId,
  type Database,
  findApiTokenOwner,
  touchApiToken,
  type User,
} from "@workspace/db"

/** Random base32 characters after the prefix: 160 bits. */
const SECRET_LENGTH = 32

/** `tsk_` plus SECRET_LENGTH random characters. */
export function generateApiTokenSecret(): string {
  // createId adds the underscore itself.
  return createId(API_TOKEN_PREFIX.slice(0, -1), SECRET_LENGTH)
}

/** Shown in Settings so tokens can be told apart: `tsk_` and 8 more. */
export function apiTokenPrefix(secret: string): string {
  return secret.slice(0, API_TOKEN_PREFIX.length + 8)
}

/**
 * SHA-256 of the secret, in hex. A plain hash is enough: the secret is
 * long and random, so there is nothing to guess or brute-force.
 */
export async function hashApiToken(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret)
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export const INVALID_TOKEN_MESSAGE =
  "This token is invalid or was revoked. Create a new one in Tusk under Settings → API & MCP."

const BEARER = new RegExp(
  `^Bearer\\s+(${API_TOKEN_PREFIX}[0-9a-z]{${SECRET_LENGTH}})\\s*$`
)

/** The account token in an `Authorization: Bearer tsk_…` header, if any. */
export function bearerApiToken(header: string | undefined): string | null {
  return header ? (BEARER.exec(header)?.[1] ?? null) : null
}

/** The owner of a live account token, marking the token used; else null. */
export async function findUserForApiToken(
  db: Database,
  secret: string
): Promise<User | null> {
  const owner = await findApiTokenOwner(db, await hashApiToken(secret))
  if (!owner) return null
  await touchApiToken(db, owner.tokenId, new Date())
  return owner.user
}
