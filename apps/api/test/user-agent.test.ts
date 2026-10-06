import { describe, expect, it } from "vitest"

import { isBot } from "../src/api/v1/ingest/bot-filter"
import { parseUserAgent } from "../src/api/v1/ingest/user-agent"

// Real user agents, copied from browsers and server logs.
const FIXTURES = [
  [
    "Chrome on Windows",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    { browser: "chrome", os: "windows", device: "desktop" },
  ],
  [
    "Safari on macOS",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
    { browser: "safari", os: "macos", device: "desktop" },
  ],
  [
    "Firefox on Linux",
    "Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0",
    { browser: "firefox", os: "linux", device: "desktop" },
  ],
  [
    "Edge on Windows",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
    { browser: "edge", os: "windows", device: "desktop" },
  ],
  [
    "Opera on Windows",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0",
    { browser: "opera", os: "windows", device: "desktop" },
  ],
  [
    "Safari on iPhone",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
    { browser: "safari", os: "ios", device: "mobile" },
  ],
  [
    "Chrome on iPhone",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.41 Mobile/15E148 Safari/604.1",
    { browser: "chrome", os: "ios", device: "mobile" },
  ],
  [
    "Firefox on iPhone",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/143.0 Mobile/15E148 Safari/605.1.15",
    { browser: "firefox", os: "ios", device: "mobile" },
  ],
  [
    "Safari on iPad",
    "Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
    { browser: "safari", os: "ios", device: "tablet" },
  ],
  [
    "Chrome on an Android phone",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
    { browser: "chrome", os: "android", device: "mobile" },
  ],
  [
    "Chrome on an Android tablet",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    { browser: "chrome", os: "android", device: "tablet" },
  ],
  [
    "Edge on Android",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 EdgA/141.0.0.0",
    { browser: "edge", os: "android", device: "mobile" },
  ],
  [
    "Samsung Internet on Android",
    "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
    { browser: "samsung-internet", os: "android", device: "mobile" },
  ],
  [
    "Firefox on Ubuntu",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0",
    { browser: "firefox", os: "ubuntu", device: "desktop" },
  ],
  [
    "an unknown browser",
    "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko)",
    { browser: null, os: null, device: "desktop" },
  ],
  [
    "a user agent with nothing to parse",
    "Mozilla/5.0",
    { browser: null, os: null, device: "desktop" },
  ],
] as const

describe("parseUserAgent", () => {
  it.each(FIXTURES)("recognizes %s", (_, userAgent, expected) => {
    expect(parseUserAgent(userAgent)).toEqual(expected)
  })
})

describe("parseUserAgent on hostile input", () => {
  it("stays fast on a user agent built to make the parser backtrack", () => {
    const userAgent = `Mozilla/5.0 (Linux; archos ${"1".repeat(480)}`
    const start = performance.now()
    parseUserAgent(userAgent)
    expect(performance.now() - start).toBeLessThan(20)
  })
})

describe("isBot", () => {
  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "WhatsApp/2.23.20.0",
    "Pingdom.com_bot_version_1.4_(http://www.pingdom.com/)",
    "python-requests/2.32.3",
    "curl/8.7.1",
    "Wget/1.21.4",
    "Go-http-client/2.0",
    "axios/1.7.7",
    "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
    "",
    "   ",
  ])("flags %j", (userAgent) => {
    expect(isBot(userAgent)).toBe(true)
  })

  it.each(FIXTURES)("lets %s through", (_, userAgent) => {
    expect(isBot(userAgent)).toBe(false)
  })
})
