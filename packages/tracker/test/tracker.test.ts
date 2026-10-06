import { afterEach, describe, expect, it, vi } from "vitest"

import {
  loadTracker,
  mockBeacon,
  resetPage,
  SITE_ID,
  sentPayloads,
} from "./helpers"

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

afterEach(resetPage)

function cookie(name: string): string | undefined {
  return document.cookie.match(`(?:^|; )${name}=([^;]*)`)?.[1]
}

describe("pageviews", () => {
  it("sends one pageview on load with the payload the collect endpoint expects", async () => {
    history.replaceState(null, "", "/pricing?utm_source=hn#faq")
    const beacon = mockBeacon()

    await loadTracker()

    expect(beacon).toHaveBeenCalledTimes(1)
    const [url, body] = beacon.mock.calls[0] ?? []
    expect(url).toBe("https://api.viewtally.test/api/v1/collect")
    expect(body?.type).toBe("text/plain")
    const [payload] = await sentPayloads(beacon)
    expect(payload).toEqual({
      siteId: SITE_ID,
      name: "pageview",
      url: "https://example.com/pricing?utm_source=hn",
      referrer: "",
      visitorId: expect.stringMatching(UUID),
      sessionId: expect.stringMatching(UUID),
      newSession: true,
    })
  })

  it("sends to the data-api origin when the script tag sets one", async () => {
    const beacon = mockBeacon()

    await loadTracker({
      "data-site": SITE_ID,
      "data-api": "https://stats.mysite.test",
    })

    expect(beacon.mock.calls[0]?.[0]).toBe(
      "https://stats.mysite.test/api/v1/collect"
    )
  })

  it("counts SPA navigations once each and ignores same-URL and hash changes", async () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(
      "https://www.google.com/"
    )
    const beacon = mockBeacon()
    await loadTracker()

    // Routers often replaceState the current URL right after load.
    history.replaceState({ ready: true }, "", "/")
    history.pushState(null, "", "/#section")
    history.pushState(null, "", "/docs")
    history.pushState(null, "", "/docs")
    history.replaceState(null, "", "/docs?tab=api")
    history.back()
    await new Promise((resolve) => addEventListener("popstate", resolve))

    const payloads = await sentPayloads(beacon)
    expect(payloads.map((p) => p.url)).toEqual([
      "https://example.com/",
      "https://example.com/docs",
      "https://example.com/docs?tab=api",
      "https://example.com/docs",
    ])
    // After the first pageview, the referrer is the previous page, not the
    // external referrer the page was loaded with.
    expect(payloads.map((p) => p.referrer)).toEqual([
      "https://www.google.com/",
      "https://example.com/",
      "https://example.com/docs",
      "https://example.com/docs?tab=api",
    ])
  })

  it("doesn't send while the page is prerendered", async () => {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue(
      "prerender" as DocumentVisibilityState
    )
    const beacon = mockBeacon()

    await loadTracker()

    expect(beacon).not.toHaveBeenCalled()
  })

  it("falls back to fetch with keepalive when the beacon is refused", async () => {
    mockBeacon(false)
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 202 }))

    await loadTracker()

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0] ?? []
    expect(url).toBe("https://api.viewtally.test/api/v1/collect")
    expect(init).toMatchObject({
      method: "POST",
      keepalive: true,
      credentials: "omit",
    })
    expect((init?.body as Blob).type).toBe("text/plain")
  })
})

describe("outbound clicks", () => {
  function clickLink(href: string, button = 0) {
    const link = document.createElement("a")
    link.href = href
    const label = document.createElement("span")
    link.append(label)
    document.body.append(link)
    // Not followed: jsdom doesn't navigate, and the test page must stay.
    link.addEventListener("click", (event) => event.preventDefault())
    label.dispatchEvent(
      new MouseEvent(button === 0 ? "click" : "auxclick", {
        bubbles: true,
        button,
      })
    )
    link.remove()
  }

  it("sends the link of a click to another site, in the same session", async () => {
    history.replaceState(null, "", "/pricing")
    const beacon = mockBeacon()
    await loadTracker()

    clickLink("https://github.com/acme?ref=x")
    clickLink("https://github.com/acme", 1)

    const [pageview, click, middleClick] = await sentPayloads(beacon)
    expect(click).toEqual({
      siteId: SITE_ID,
      name: "outbound",
      url: "https://example.com/pricing",
      href: "https://github.com/acme",
      referrer: "",
      visitorId: pageview?.visitorId,
      sessionId: pageview?.sessionId,
      newSession: false,
    })
    expect(middleClick).toMatchObject({ name: "outbound" })
  })

  it("ignores links within the site, its www host and non-web links", async () => {
    const beacon = mockBeacon()
    await loadTracker()

    clickLink("/pricing")
    clickLink("https://www.example.com/blog")
    clickLink("mailto:hi@example.org")

    expect(beacon).toHaveBeenCalledTimes(1)
  })
})

describe("visitor and session ids", () => {
  it("sets the visitor and session cookies and reuses them on the next load", async () => {
    const beacon = mockBeacon()

    await loadTracker()
    await loadTracker()

    const [first, second] = await sentPayloads(beacon)
    expect(cookie("vt_vid")).toBe(first?.visitorId)
    expect(cookie("vt_sid")).toBe(first?.sessionId)
    expect(second).toMatchObject({
      visitorId: first?.visitorId,
      sessionId: first?.sessionId,
      newSession: false,
    })
  })

  it("starts a new session after 30 minutes without events, keeping the visitor", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    const beacon = mockBeacon()
    await loadTracker()

    vi.advanceTimersByTime(29 * 60_000)
    history.pushState(null, "", "/still-same-visit")
    vi.advanceTimersByTime(31 * 60_000)
    history.pushState(null, "", "/next-visit")

    const [first, sameVisit, nextVisit] = await sentPayloads(beacon)
    expect(sameVisit).toMatchObject({
      sessionId: first?.sessionId,
      newSession: false,
    })
    expect(nextVisit?.newSession).toBe(true)
    expect(nextVisit?.sessionId).not.toBe(first?.sessionId)
    expect(nextVisit?.visitorId).toBe(first?.visitorId)
  })

  it("replaces a visitor cookie that isn't a valid id", async () => {
    document.cookie = "vt_vid=<script>; Path=/"
    const beacon = mockBeacon()

    await loadTracker()

    const [payload] = await sentPayloads(beacon)
    expect(payload?.visitorId).toMatch(UUID)
    expect(cookie("vt_vid")).toBe(payload?.visitorId)
  })
})

describe("skipping", () => {
  it("does nothing when localStorage.vt_ignore is set", async () => {
    localStorage.setItem("vt_ignore", "1")
    const beacon = mockBeacon()

    await loadTracker()

    expect(beacon).not.toHaveBeenCalled()
    expect(cookie("vt_vid")).toBeUndefined()
  })

  it("does nothing without data-site", async () => {
    const beacon = mockBeacon()

    await loadTracker({})

    expect(beacon).not.toHaveBeenCalled()
  })
})

describe("never throwing on the host page", () => {
  it("still sends, with one id per page, when cookies and storage are blocked", async () => {
    vi.spyOn(document, "cookie", "get").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError")
    })
    vi.spyOn(document, "cookie", "set").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError")
    })
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError")
    })
    const beacon = mockBeacon()

    await loadTracker()
    history.pushState(null, "", "/next")

    const [first, second] = await sentPayloads(beacon)
    expect(second).toMatchObject({
      visitorId: first?.visitorId,
      sessionId: first?.sessionId,
      newSession: false,
    })
  })

  it("doesn't throw when sendBeacon and fetch both throw", async () => {
    Object.defineProperty(navigator, "sendBeacon", {
      value: () => {
        throw new TypeError("Illegal invocation")
      },
      configurable: true,
    })
    vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new TypeError("fetch is not available")
    })

    await expect(loadTracker()).resolves.toBeUndefined()
    expect(() => history.pushState(null, "", "/next")).not.toThrow()
  })

  it("doesn't throw when data-api isn't a URL", async () => {
    await expect(
      loadTracker({ "data-site": SITE_ID, "data-api": "http://[" })
    ).resolves.toBeUndefined()
  })
})
