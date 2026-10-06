import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as z from "zod"

import { apiRequest } from "@/lib/api-client"

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`)
  }),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ cookie: "session=abc" }),
}))
vi.mock("next/navigation", () => ({ redirect }))

const schema = z.object({ hello: z.string() })

function mockFetch(status: number, body: unknown) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json(body, { status }))
}

beforeEach(() => {
  vi.stubEnv("API_ORIGIN", "http://api.test")
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe("apiRequest", () => {
  it("forwards the cookie and returns the validated body", async () => {
    const fetch = mockFetch(200, { hello: "world" })

    const result = await apiRequest("/api/v1/sites", schema)

    expect(result).toEqual({ ok: true, data: { hello: "world" } })
    const [url, init] = fetch.mock.lastCall ?? []
    expect(url).toBe("http://api.test/api/v1/sites")
    expect(init?.headers).toMatchObject({ cookie: "session=abc" })
  })

  it("returns API errors as a failed result", async () => {
    mockFetch(404, { error: { code: "not_found", message: "Site not found" } })

    const result = await apiRequest("/api/v1/sites/vt_x", schema)

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: { code: "not_found", message: "Site not found" },
    })
  })

  it("redirects to sign-in when the session has ended", async () => {
    mockFetch(401, {
      error: { code: "unauthorized", message: "Sign in to continue" },
    })

    await expect(apiRequest("/api/v1/sites", schema)).rejects.toThrow(
      "redirect:/signup"
    )
  })

  it("throws when a success body doesn't match the schema", async () => {
    mockFetch(200, { hello: 42 })

    await expect(apiRequest("/api/v1/sites", schema)).rejects.toThrow(
      "GET /api/v1/sites returned an unexpected body"
    )
  })
})
