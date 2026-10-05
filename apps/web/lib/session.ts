import "server-only"

import { headers } from "next/headers"
import { cache } from "react"

import type { Session } from "./auth-client"
import { apiOrigin } from "./env"

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
