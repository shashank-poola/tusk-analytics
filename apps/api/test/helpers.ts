import { createDb, eq, sites, user } from "@workspace/db"
import { env } from "cloudflare:workers"
import { Hono } from "hono"
import { expect, vi } from "vitest"

import { app } from "../src/app"
import type { AppEnv } from "../src/config/env"
import { errorHandler } from "../src/middleware/error-handler"
import { requireSite } from "../src/middleware/require-site"
import { requireUser } from "../src/middleware/require-user"

/** The real middleware on stable test routes, independent of api/v1. */
export const middlewareApp = new Hono<AppEnv>()
  .get("/me", requireUser, (c) => c.json({ userId: c.get("user").id }))
  .get("/sites/:siteId", requireUser, requireSite, (c) =>
    c.json({ siteId: c.get("site").id })
  )
  .onError(errorHandler)

export function uniqueEmail(): string {
  return `${crypto.randomUUID()}@example.com`
}

/**
 * Rate limits are per IP, so each sign-in gets its own address to keep tests
 * independent of each other.
 */
function randomIp(): string {
  const [a = 0, b = 0, c = 0] = crypto.getRandomValues(new Uint8Array(3))
  return `10.${a}.${b}.${c}`
}

/** Mocks Resend and returns the spy, so tests can read the sent email. */
export function mockResend() {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json({ id: "email_test" }))
}

export function requestMagicLink(email: string, ip = randomIp()) {
  return app.request(
    "/api/auth/sign-in/magic-link",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: env.BETTER_AUTH_URL,
        "cf-connecting-ip": ip,
      },
      body: JSON.stringify({ email, callbackURL: "/" }),
    },
    env
  )
}

/** The JSON body of the most recent request to Resend. */
export function lastSentEmail(resend: ReturnType<typeof mockResend>) {
  const init = resend.mock.lastCall?.[1]
  if (typeof init?.body !== "string") throw new Error("No email was sent")
  return JSON.parse(init.body) as { to: string[]; text: string }
}

/**
 * Signs in through the real magic-link flow (with Resend mocked) and returns
 * the session cookie.
 */
export async function signIn(
  email = uniqueEmail()
): Promise<{ cookie: string; userId: string }> {
  const resend = mockResend()
  const ip = randomIp()
  try {
    const sent = await requestMagicLink(email, ip)
    expect(sent.status).toBe(200)

    const link = lastSentEmail(resend).text.match(/https?:\/\/\S+/)?.[0]
    if (!link) throw new Error("The email has no magic link")

    const verified = await app.request(
      link,
      { headers: { "cf-connecting-ip": ip } },
      env
    )
    const cookie = verified.headers
      .getSetCookie()
      .find((c) => c.startsWith("better-auth.session_token="))
      ?.split(";")[0]
    if (!cookie) throw new Error("Verifying the magic link set no session")

    const [row] = await createDb(env.DB)
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
    if (!row) throw new Error("Signing in created no user")

    return { cookie, userId: row.id }
  } finally {
    resend.mockRestore()
  }
}

export async function createSite(ownerId: string) {
  const [site] = await createDb(env.DB)
    .insert(sites)
    .values({
      ownerId,
      name: "Test site",
      domain: `${crypto.randomUUID()}.com`,
    })
    .returning()
  if (!site) throw new Error("Failed to create site")
  return site
}
