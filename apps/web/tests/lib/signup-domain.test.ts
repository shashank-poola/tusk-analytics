import { describe, expect, it } from "vitest"

import { parseSignupDomain } from "@/lib/signup-domain"

describe("parseSignupDomain", () => {
  it("returns the normalized domain", () => {
    expect(parseSignupDomain("https://www.MyApp.com/pricing")).toBe("myapp.com")
  })

  it("ignores a missing or invalid value, since the browser set it", () => {
    expect(parseSignupDomain(undefined)).toBeUndefined()
    expect(parseSignupDomain("<script>")).toBeUndefined()
    expect(parseSignupDomain("192.168.0.1")).toBeUndefined()
  })
})
