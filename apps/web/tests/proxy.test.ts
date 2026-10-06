import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { proxy } from "@/proxy"

const SITE = "http://localhost:3000/site/vt_3k9x2m7qpd4n8r1t"

function request(search: string, headers: Record<string, string> = {}) {
  return new NextRequest(`${SITE}${search}`, { headers })
}

describe("proxy", () => {
  it("moves the view into a cookie and redirects to the clean URL", () => {
    const response = proxy(request("?view=1&range=30d&country=IN"))

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(SITE)
    const cookie = response.cookies.get("vt_view")
    expect(cookie).toMatchObject({
      value: "range=30d&country=IN",
      path: "/site/vt_3k9x2m7qpd4n8r1t",
      httpOnly: true,
      sameSite: "lax",
    })
  })

  it("stores an empty view, so the default period can be chosen again", () => {
    const response = proxy(request("?view=1"))

    expect(response.status).toBe(307)
    expect(response.cookies.get("vt_view")?.value).toBe("")
  })

  it("leaves a plain visit alone", () => {
    const response = proxy(request(""))

    expect(response.headers.get("location")).toBeNull()
    expect(response.cookies.get("vt_view")).toBeUndefined()
  })

  it("never changes the view for a prefetch", () => {
    const response = proxy(
      request("?view=1&range=30d", { "next-router-prefetch": "1" })
    )

    expect(response.headers.get("location")).toBeNull()
    expect(response.cookies.get("vt_view")).toBeUndefined()
  })

  it("keeps a view too long for a cookie in the URL", () => {
    const response = proxy(request(`?view=1&page=${"x".repeat(3100)}`))

    expect(response.headers.get("location")).toBeNull()
    expect(response.cookies.get("vt_view")).toBeUndefined()
  })
})
