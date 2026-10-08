import { MAX_API_TOKENS_PER_USER } from "@workspace/contracts"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import {
  api,
  apiWithToken,
  createApiToken,
  createSite,
  middlewareApp,
  signIn,
} from "./helpers"

type TokenList = {
  tokens: {
    id: string
    name: string
    prefix: string
    lastUsedAt: string | null
  }[]
}

async function listTokens(cookie: string): Promise<TokenList> {
  const res = await api("/tokens", { cookie })
  expect(res.status).toBe(200)
  return (await res.json()) as TokenList
}

describe("account tokens", () => {
  it("shows the secret once and lists only its prefix", async () => {
    const { cookie } = await signIn()

    const secret = await createApiToken(cookie, "Claude Code")
    const { tokens } = await listTokens(cookie)

    expect(secret).toMatch(/^tsk_[0-9a-z]{32}$/)
    expect(tokens).toEqual([
      expect.objectContaining({
        name: "Claude Code",
        prefix: secret.slice(0, 12),
        lastUsedAt: null,
      }),
    ])
    expect(JSON.stringify(tokens)).not.toContain(secret)
  })

  it("reads the owner's sites and marks the token used", async () => {
    const { cookie, userId } = await signIn()
    const site = await createSite(userId)
    const secret = await createApiToken(cookie)

    const res = await apiWithToken("/sites", secret)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      sites: [expect.objectContaining({ id: site.id })],
    })
    const { tokens } = await listTokens(cookie)
    expect(tokens[0]?.lastUsedAt).not.toBeNull()
  })

  it("answers 404 for another user's site", async () => {
    const owner = await signIn()
    const site = await createSite(owner.userId)
    const other = await signIn()
    const secret = await createApiToken(other.cookie)

    const res = await apiWithToken(`/sites/${site.id}/stats/overview`, secret)

    expect(res.status).toBe(404)
  })

  it("can't change anything", async () => {
    const { cookie } = await signIn()
    const secret = await createApiToken(cookie)

    const res = await apiWithToken("/sites", secret, {
      method: "POST",
      body: JSON.stringify({ name: "x", domain: "x.com", timezone: "UTC" }),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: { code: "forbidden", message: "Account tokens are read-only" },
    })
  })

  it("can't list tokens: token management takes a session", async () => {
    const { cookie } = await signIn()
    const secret = await createApiToken(cookie)

    const res = await apiWithToken("/tokens", secret)

    expect(res.status).toBe(401)
  })

  it("can't reach routes that only take a session", async () => {
    const { cookie } = await signIn()
    const secret = await createApiToken(cookie)

    const res = await middlewareApp.request(
      "/me",
      { headers: { Authorization: `Bearer ${secret}` } },
      env
    )

    expect(res.status).toBe(401)
  })

  it("stops working once revoked", async () => {
    const { cookie } = await signIn()
    const secret = await createApiToken(cookie)
    const [token] = (await listTokens(cookie)).tokens

    const revoked = await api(
      `/tokens/${token?.id}`,
      { cookie },
      { method: "DELETE" }
    )
    const res = await apiWithToken("/sites", secret)

    expect(revoked.status).toBe(204)
    expect(res.status).toBe(401)
  })

  it("answers 404 when revoking another user's token", async () => {
    const owner = await signIn()
    await createApiToken(owner.cookie)
    const [token] = (await listTokens(owner.cookie)).tokens
    const other = await signIn()

    const res = await api(
      `/tokens/${token?.id}`,
      { cookie: other.cookie },
      { method: "DELETE" }
    )

    expect(res.status).toBe(404)
    expect((await listTokens(owner.cookie)).tokens).toHaveLength(1)
  })

  it("rejects an unknown token", async () => {
    const res = await apiWithToken("/sites", `tsk_${"a".repeat(32)}`)

    expect(res.status).toBe(401)
  })

  it("refuses a name that is empty", async () => {
    const { cookie } = await signIn()

    const res = await api(
      "/tokens",
      { cookie },
      { method: "POST", body: JSON.stringify({ name: "  " }) }
    )

    expect(res.status).toBe(400)
  })

  it(`stops at ${MAX_API_TOKENS_PER_USER} tokens per user`, async () => {
    const { cookie } = await signIn()
    for (let i = 0; i < MAX_API_TOKENS_PER_USER; i++) {
      await createApiToken(cookie, `Token ${i}`)
    }

    const res = await api(
      "/tokens",
      { cookie },
      { method: "POST", body: JSON.stringify({ name: "One more" }) }
    )

    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({
      error: { code: "token_limit_reached" },
    })
  })
})
