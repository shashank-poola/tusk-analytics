import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { userNameSchema } from "@workspace/contracts"
import {
  account,
  createDb,
  rateLimit,
  session,
  user,
  verification,
} from "@workspace/db"
// "minimal" leaves out Kysely, which we don't need with the Drizzle adapter.
import { APIError } from "better-auth/api"
import { betterAuth } from "better-auth/minimal"
import { magicLink } from "better-auth/plugins"
import * as z from "zod"

import type { Bindings } from "../config/env"
import { sendMagicLinkEmail } from "./auth.email"

const MAX_IMAGE_URL_LENGTH = 2048

/**
 * The avatar is rendered as <img src>, so only https URLs: no javascript:,
 * data: or mixed content. null removes it.
 */
const userImageSchema = z
  .url({ protocol: /^https$/, error: "Use an https:// image URL." })
  .max(
    MAX_IMAGE_URL_LENGTH,
    `Keep the image URL under ${MAX_IMAGE_URL_LENGTH} characters.`
  )
  .nullable()

function badRequest(code: string, error: z.ZodError, fallback: string) {
  return new APIError("BAD_REQUEST", {
    code,
    message: error.issues[0]?.message ?? fallback,
  })
}

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
    databaseHooks: {
      user: {
        update: {
          // Better Auth checks neither field beyond its type; the settings
          // page edits both, so validate them at this boundary.
          before: async (user) => {
            const data = { ...user }
            if (user.name !== undefined) {
              const name = userNameSchema.safeParse(user.name)
              if (!name.success) {
                throw badRequest("INVALID_NAME", name.error, "Invalid name")
              }
              data.name = name.data
            }
            if (user.image !== undefined) {
              const image = userImageSchema.safeParse(user.image)
              if (!image.success) {
                throw badRequest("INVALID_IMAGE", image.error, "Invalid image")
              }
              data.image = image.data
            }
            return { data }
          },
        },
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
      customRules: {
        // The web app reads the session on every page load. With D1 storage,
        // limiting it would add a D1 write per page view, and reading a
        // session can't be abused. Sign-in routes keep their limits.
        "/get-session": false,
      },
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
