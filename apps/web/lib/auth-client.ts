import { magicLinkClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

/**
 * Better Auth in the browser. No baseURL: it calls /api/auth on this origin,
 * which Next.js proxies to the API Worker.
 */
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
})

export type Session = typeof authClient.$Infer.Session
