import "server-only"

import { headers } from "next/headers"
import { cache } from "react"
import * as z from "zod"

import type { Session } from "./auth-client"
import { apiOrigin } from "./env"

// The only direct fetches in the web app: Better Auth endpoints, which
// `apiRequest` (for /api/v1) doesn't cover.

/**
 * The signed-in session, or null. Asks the API directly, forwarding the
 * browser's cookies. Cached so a layout and its page share one request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const response = await fetch(`${apiOrigin()}/api/auth/get-session`, {
    headers: { cookie: (await headers()).get("cookie") ?? "" },
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(
      `Session check failed with status ${response.status}. See the API (apps/api) terminal for the cause.`
    )
  }
  return response.json()
})

const linkedAccountsSchema = z.array(
  z.object({ id: z.string(), providerId: z.string() })
)
type LinkedAccount = z.infer<typeof linkedAccountsSchema>[number]

/** Sign-in providers linked to the signed-in user (Better Auth accounts). */
export async function listLinkedAccounts(): Promise<LinkedAccount[]> {
  const response = await fetch(`${apiOrigin()}/api/auth/list-accounts`, {
    headers: { cookie: (await headers()).get("cookie") ?? "" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    throw new Error(
      `Listing linked accounts failed with status ${response.status}. See the API (apps/api) terminal for the cause.`
    )
  }
  return linkedAccountsSchema.parse(await response.json())
}
