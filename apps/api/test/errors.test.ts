import { env } from "cloudflare:workers"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { afterEach, describe, expect, it, vi } from "vitest"

import { app } from "../src/app"
import { assertValidEnv } from "../src/config/env"
import { AppError } from "../src/lib/errors"
import { errorHandler } from "../src/middleware/error-handler"

function appThrowing(error: unknown) {
  return new Hono()
    .get("/", () => {
      throw error
    })
    .onError(errorHandler)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("error format", () => {
  it("turns an AppError into its status and code", async () => {
    const res = await appThrowing(
      new AppError("not_found", "Site not found")
    ).request("/")

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      error: { code: "not_found", message: "Site not found" },
    })
  })

  it("keeps the status and message of Hono's own 4xx errors", async () => {
    const res = await appThrowing(
      new HTTPException(400, { message: "Malformed JSON in request body" })
    ).request("/")

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: { code: "bad_request", message: "Malformed JSON in request body" },
    })
  })

  it("hides the details of unexpected errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})

    const res = await appThrowing(
      new Error("D1_ERROR: no such table: sites")
    ).request("/")

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({
      error: { code: "internal_error", message: "Something went wrong" },
    })
    expect(log).toHaveBeenCalled()
  })

  it("uses the format for unknown routes", async () => {
    const res = await app.request("/api/v1/nope", {}, env)

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      error: { code: "not_found", message: "Not found" },
    })
  })

  it("uses the format for errors thrown inside /api/v1", async () => {
    // Hits the temporary sites route; point it at a real v1 route later.
    const res = await app.request("/api/v1/sites/vt_anything", {}, env)

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({
      error: { code: "unauthorized", message: "Sign in to continue" },
    })
  })
})

describe("env validation", () => {
  it("lists every missing or invalid variable", () => {
    const env = { DB: {}, BETTER_AUTH_URL: "not a url", EMAIL_FROM: "" }

    expect(() => assertValidEnv(env)).toThrowError(
      /DB: missing D1 binding[\s\S]*BETTER_AUTH_URL: missing or not a valid URL[\s\S]*BETTER_AUTH_SECRET: missing[\s\S]*GOOGLE_CLIENT_ID: missing[\s\S]*GOOGLE_CLIENT_SECRET: missing[\s\S]*RESEND_API_KEY: missing[\s\S]*EMAIL_FROM: missing/
    )
  })

  it("makes the API answer 500 in the error format", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    const res = await app.request("/api/v1/nope", {}, { DB: env.DB })

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({
      error: { code: "internal_error", message: "Something went wrong" },
    })
  })
})
