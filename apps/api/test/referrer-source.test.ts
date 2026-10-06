import { describe, expect, it } from "vitest"

import {
  classifySource,
  referrerHost,
} from "../src/api/v1/ingest/referrer-source"

describe("referrerHost", () => {
  it.each([
    ["https://news.ycombinator.com/item?id=1", "news.ycombinator.com"],
    ["http://WWW.Example.org:8080/a", "www.example.org"],
    ["", null],
    ["not a url", null],
    ["javascript:alert(1)", null],
    ["https://myapp.com/pricing", null],
    ["https://www.myapp.com/", null],
    ["https://blog.myapp.com/", "blog.myapp.com"],
  ])("turns %j into %j for the site myapp.com", (referrer, expected) => {
    expect(referrerHost(referrer, "myapp.com")).toBe(expected)
  })
})

describe("classifySource", () => {
  it.each([
    ["www.google.com", "google"],
    ["google.co.uk", "google"],
    ["www.google.com.au", "google"],
    ["www.bing.com", "bing"],
    ["duckduckgo.com", "duckduckgo"],
    ["t.co", "x"],
    ["x.com", "x"],
    ["mobile.twitter.com", "x"],
    ["l.facebook.com", "facebook"],
    ["www.linkedin.com", "linkedin"],
    ["old.reddit.com", "reddit"],
    ["news.ycombinator.com", "hackernews"],
    ["github.com", "github"],
    ["www.producthunt.com", "producthunt"],
    ["chatgpt.com", "chatgpt"],
    ["chat.openai.com", "chatgpt"],
    ["www.perplexity.ai", "perplexity"],
    ["blog.example.org", "blog.example.org"],
    ["notgoogle.com", "notgoogle.com"],
  ])("maps the referrer %j to %j", (referrer, expected) => {
    expect(classifySource({ utmSource: null, referrer })).toBe(expected)
  })

  it("prefers utm_source, lowercased, over the referrer", () => {
    expect(
      classifySource({ utmSource: "Newsletter", referrer: "www.google.com" })
    ).toBe("newsletter")
  })

  it("falls back to direct", () => {
    expect(classifySource({ utmSource: null, referrer: null })).toBe("direct")
  })
})
