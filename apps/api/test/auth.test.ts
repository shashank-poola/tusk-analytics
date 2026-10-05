import { createDb, eq, rateLimit } from "@workspace/db"
import { env } from "cloudflare:workers"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  lastSentEmail,
  mockResend,
  requestMagicLink,
  signIn,
  uniqueEmail,
} from "./helpers"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("magic link", () => {
  it("sends the link through Resend", async () => {
    const resend = mockResend()
    const email = uniqueEmail()

    await requestMagicLink(email)

    const [url, init] = resend.mock.lastCall ?? []
    expect(url).toBe("https://api.resend.com/emails")
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      `Bearer ${env.RESEND_API_KEY}`
    )
    const sent = lastSentEmail(resend)
    expect(sent.to).toEqual([email])
    expect(sent.text).toContain(
      `${env.BETTER_AUTH_URL}/api/auth/magic-link/verify?token=`
    )
  })

  it("answers the same for new and existing emails", async () => {
    const existing = uniqueEmail()
    await signIn(existing)
    mockResend()

    const forExisting = await requestMagicLink(existing)
    const forNew = await requestMagicLink(uniqueEmail())

    expect(forExisting.status).toBe(forNew.status)
    expect(await forExisting.json()).toEqual(await forNew.json())
  })
})

describe("rate limiting", () => {
  it("limits magic-link requests per IP, counted in D1", async () => {
    mockResend()
    const ip = "10.255.255.1"

    // The magic-link plugin allows 5 requests per minute.
    for (let i = 0; i < 5; i++) {
      expect((await requestMagicLink(uniqueEmail(), ip)).status).toBe(200)
    }
    const blocked = await requestMagicLink(uniqueEmail(), ip)

    expect(blocked.status).toBe(429)
    const [row] = await createDb(env.DB)
      .select()
      .from(rateLimit)
      .where(eq(rateLimit.key, `${ip}|/sign-in/magic-link`))
    expect(row?.count).toBe(5)
  })
})
