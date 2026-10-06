import { describe, expect, it } from "vitest"

import { collectPayloadSchema } from "../src"

const VALID = {
  siteId: "vt_3k9x2m7qpd4n8r1t",
  name: "pageview",
  url: "https://myapp.com/pricing?utm_source=hn",
  referrer: "",
  visitorId: "2f1c7a4e-5b3d-4c8a-9e6f-1a2b3c4d5e6f",
  sessionId: "9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
  newSession: true,
}

describe("collectPayloadSchema", () => {
  it("accepts what the tracker sends", () => {
    expect(collectPayloadSchema.parse(VALID)).toEqual(VALID)
  })

  it("accepts an outbound click with the link it went to", () => {
    const click = { ...VALID, name: "outbound", href: "https://github.com/a" }
    expect(collectPayloadSchema.parse(click)).toEqual(click)
  })

  it.each([
    ["without a link", { href: undefined }],
    ["to a non-http link", { href: "mailto:a@b.co" }],
  ])("rejects an outbound click %s", (_, override) => {
    const click = { ...VALID, name: "outbound", href: "https://a.com" }
    expect(
      collectPayloadSchema.safeParse({ ...click, ...override }).success
    ).toBe(false)
  })

  it("ignores fields it doesn't know, so new tracker fields stay compatible", () => {
    expect(collectPayloadSchema.parse({ ...VALID, extra: 1 })).toEqual(VALID)
  })

  it.each([
    ["a site id in the wrong format", { siteId: "vt_UPPER" }],
    ["an event other than pageview", { name: "signup" }],
    ["a non-http URL", { url: "javascript:alert(1)//" }],
    [
      "a URL over 2048 characters",
      { url: `https://a.com/${"x".repeat(2048)}` },
    ],
    ["a referrer over 2048 characters", { referrer: "x".repeat(2049) }],
    ["a visitor id that isn't a UUID", { visitorId: "abc" }],
    ["a session id that isn't a UUID", { sessionId: "abc" }],
    ["a missing newSession", { newSession: undefined }],
  ])("rejects %s", (_, override) => {
    expect(
      collectPayloadSchema.safeParse({ ...VALID, ...override }).success
    ).toBe(false)
  })
})
