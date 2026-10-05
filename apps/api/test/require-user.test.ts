import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import { middlewareApp, signIn } from "./helpers"

describe("requireUser", () => {
  it("returns 401 without a session cookie", async () => {
    const res = await middlewareApp.request("/me", {}, env)

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({
      error: { code: "unauthorized", message: "Sign in to continue" },
    })
  })

  it("returns 401 for a forged session cookie", async () => {
    const res = await middlewareApp.request(
      "/me",
      { headers: { Cookie: "better-auth.session_token=forged.signature" } },
      env
    )

    expect(res.status).toBe(401)
  })

  it("puts the signed-in user on the context", async () => {
    const { cookie, userId } = await signIn()

    const res = await middlewareApp.request(
      "/me",
      { headers: { Cookie: cookie } },
      env
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ userId })
  })
})
