import { describe, expect, it } from "vitest"

import { createSiteInputSchema, domainSchema, timezoneSchema } from "../src"

describe("domainSchema", () => {
  it.each([
    ["example.com", "example.com"],
    ["  Example.COM  ", "example.com"],
    ["https://www.example.com/pricing?plan=pro#top", "example.com"],
    ["http://blog.example.co.uk:8080/", "blog.example.co.uk"],
    ["www.example.com", "example.com"],
    ["//example.com/path", "example.com"],
    ["example.com?ref=hn", "example.com"],
    ["example.com:", "example.com"],
    ["www.www.example.com", "www.example.com"],
    ["wwwexample.com", "wwwexample.com"],
    ["my-app.io", "my-app.io"],
    ["xn--mnchen-3ya.de", "xn--mnchen-3ya.de"],
    ["localhost", "localhost"],
    ["http://localhost:3000/dashboard", "localhost"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(domainSchema.parse(input)).toBe(expected)
  })

  it.each([
    ["", "Enter a domain like myapp.com"],
    ["   ", "Enter a domain like myapp.com"],
    ["https://", "Enter a domain like myapp.com"],
    ["example", "Enter a domain like myapp.com"],
    ["example.com.", "Enter a domain like myapp.com"],
    ["example..com", "Enter a domain like myapp.com"],
    ["-example.com", "Enter a domain like myapp.com"],
    ["example-.com", "Enter a domain like myapp.com"],
    ["exa mple.com", "Enter a domain like myapp.com"],
    ["user@example.com", "Enter a domain like myapp.com"],
    ["münchen.de", "Enter a domain like myapp.com"],
    ["example.123", "Enter a domain like myapp.com"],
    [`${"a".repeat(64)}.com`, "Enter a domain like myapp.com"],
    [`${"a.".repeat(127)}com`, "Enter a domain like myapp.com"],
    [
      `https://example.com/${"a".repeat(2048)}`,
      "Enter a domain like myapp.com",
    ],
    ["192.168.0.1", "Use your site's domain, not an IP address"],
    ["http://127.0.0.1:8080/", "Use your site's domain, not an IP address"],
    ["[::1]:3000", "Use your site's domain, not an IP address"],
    ["2001:db8::1", "Use your site's domain, not an IP address"],
  ])("rejects %j", (input, message) => {
    const result = domainSchema.safeParse(input)

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      message,
    ])
  })
})

describe("timezoneSchema", () => {
  it.each(["UTC", "Europe/Berlin", "Asia/Kolkata", "America/Argentina/Salta"])(
    "accepts the IANA zone %j",
    (zone) => {
      expect(timezoneSchema.parse(zone)).toBe(zone)
    }
  )

  it.each(["", "Mars/Olympus_Mons", "+05:30", "-08:00", "Europe/Berlin;"])(
    "rejects %j",
    (zone) => {
      expect(timezoneSchema.safeParse(zone).success).toBe(false)
    }
  )
})

describe("createSiteInputSchema", () => {
  it("names the site after its domain when no name is given", () => {
    const input = createSiteInputSchema.parse({
      domain: "https://www.example.com/",
      timezone: "UTC",
    })

    expect(input).toEqual({
      domain: "example.com",
      timezone: "UTC",
      name: "example.com",
    })
  })

  it("keeps a given name, trimmed", () => {
    const input = createSiteInputSchema.parse({
      domain: "example.com",
      timezone: "UTC",
      name: "  Marketing site ",
    })

    expect(input.name).toBe("Marketing site")
  })
})
