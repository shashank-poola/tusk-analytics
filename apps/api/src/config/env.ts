import type { Site } from "@workspace/db"
import * as z from "zod"

import type { AuthSession, AuthUser } from "../auth/auth.config"

const requiredString = z.string({ error: "missing" }).trim().min(1, "missing")

const envSchema = z.object({
  DB: z.custom<D1Database>(
    (value) =>
      typeof value === "object" && value !== null && "prepare" in value,
    "missing D1 binding; check d1_databases in wrangler.jsonc"
  ),
  /** The Next.js origin, e.g. `http://localhost:3000`. */
  BETTER_AUTH_URL: z.url({ error: "missing or not a valid URL" }),
  BETTER_AUTH_SECRET: requiredString.min(
    32,
    "must be at least 32 characters (openssl rand -base64 32)"
  ),
  GOOGLE_CLIENT_ID: requiredString,
  GOOGLE_CLIENT_SECRET: requiredString,
  RESEND_API_KEY: requiredString,
  /** Sender of auth emails, e.g. `Viewtally <login@viewtally.com>`. */
  EMAIL_FROM: requiredString,
})

export type Bindings = z.infer<typeof envSchema>

type UserVariables = {
  user: AuthUser
  session: AuthSession
}

/** Every route. */
export type AppEnv = {
  Bindings: Bindings
}

/** Routes behind `requireUser`. */
export type UserEnv = {
  Bindings: Bindings
  Variables: UserVariables
}

/** Routes behind `requireUser` and `requireSite`. */
export type SiteEnv = {
  Bindings: Bindings
  Variables: UserVariables & { site: Site }
}

// Workers usually reuse the same env object across requests in an isolate,
// so this skips re-validating it on every request.
const validated = new WeakSet<object>()

/** Throws an error listing every missing or invalid variable. */
export function assertValidEnv(env: object): void {
  if (validated.has(env)) return

  const result = envSchema.safeParse(env)
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `  - ${issue.path.join(".")}: ${issue.message}`
    )
    throw new Error(
      [
        "Invalid API environment. Set these in apps/api/.dev.vars (local) or as Worker secrets:",
        ...problems,
      ].join("\n")
    )
  }

  validated.add(env)
}
