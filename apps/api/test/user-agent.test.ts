import { describe, expect, it } from "vitest"

import { isBot } from "../src/api/v1/ingest/bot-filter"
import { parseUserAgent } from "../src/api/v1/ingest/user-agent"

// Real user agents, copied from browsers and server logs.
const FIXTURES = [
  [
    "Chrome on Windows",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    { browser: "Chrome", os: "Windows", device: "desktop" },
  ],
  [
    "Safari on macOS",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
    { browser: "Safari", os: "macOS", device: "desktop" },
  ],
  [
    "Firefox on Linux",
    "Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0",
    { browser: "Firefox", os: "Linux", device: "desktop" },
  ],
  [
    "Edge on Windows",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
    { browser: "Edge", os: "Windows", device: "desktop" },
  ],
  [
    "Opera on Windows",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0",
    { browser: "Opera", os: "Windows", device: "desktop" },
  ],
  [
    "Safari on iPhone",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
    { browser: "Safari", os: "iOS", device: "mobile" },
  ],
  [
    "Chrome on iPhone",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.41 Mobile/15E148 Safari/604.1",
    { browser: "Chrome", os: "iOS", device: "mobile" },
  ],
  [
    "Firefox on iPhone",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/143.0 Mobile/15E148 Safari/605.1.15",
    { browser: "Firefox", os: "iOS", device: "mobile" },
  ],
  [
    "Safari on iPad",
    "Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
    { browser: "Safari", os: "iOS", device: "tablet" },
  ],
  [
    "Chrome on an Android phone",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
    { browser: "Chrome", os: "Android", device: "mobile" },
  ],
  [
    "Chrome on an Android tablet",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    { browser: "Chrome", os: "Android", device: "tablet" },
  ],
  [
    "Edge on Android",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 EdgA/141.0.0.0",
    { browser: "Edge", os: "Android", device: "mobile" },
  ],
  [
    "an unknown browser",
    "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko)",
    { browser: null, os: null, device: "desktop" },
  ],
] as const

describe("parseUserAgent", () => {
  it.each(FIXTURES)("recognizes %s", (_, userAgent, expected) => {
    expect(parseUserAgent(userAgent)).toEqual(expected)
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
