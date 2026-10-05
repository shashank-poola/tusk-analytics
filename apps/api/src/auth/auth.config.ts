import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import {
  account,
  createDb,
  rateLimit,
  session,
  user,
  verification,
} from "@workspace/db"
// "minimal" leaves out Kysely, which we don't need with the Drizzle adapter.
import { betterAuth } from "better-auth/minimal"
import { magicLink } from "better-auth/plugins"

import type { Bindings } from "../config/env"
import { sendMagicLinkEmail } from "./auth.email"

/**
 * Workers hand out bindings per request, so build a new instance per request
 * instead of keeping one at module level.
 */
export function createAuth(env: Bindings) {
  return betterAuth({
    // The Next.js origin. The browser only talks to it; it forwards /api/* here.
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BETTER_AUTH_URL],
    database: drizzleAdapter(createDb(env.DB), {
      provider: "sqlite",
      schema: { user, session, account, verification, rateLimit },
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    plugins: [
      // Unknown emails get an account on first sign-in, so the response is the
      // same whether or not the email is registered.
      magicLink({
        expiresIn: 60 * 5,
        storeToken: "hashed",
        sendMagicLink: ({ email, url }) =>
          sendMagicLinkEmail(env, { to: email, url }),
      }),
    ],
    rateLimit: {
      // Better Auth only enables this when NODE_ENV is "production", and
      // Workers don't set NODE_ENV.
      enabled: true,
      // The default in-memory store is per isolate, so it barely limits
      // anything on Workers. D1 is shared by all of them.
      storage: "database",
    },
    advanced: {
      ipAddress: {
        // Set by Cloudflare from the TCP connection; clients can't forge it.
        // Behind the Next.js rewrite it is the proxy's IP, not the user's, so
        // production needs `trustedProxies` + x-forwarded-for once the
        // Next.js host is known.
        ipAddressHeaders: ["cf-connecting-ip"],
      },
    },
  })
}

type Auth = ReturnType<typeof createAuth>
export type AuthUser = Auth["$Infer"]["Session"]["user"]
export type AuthSession = Auth["$Infer"]["Session"]["session"]
