import { afterEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_SCRIPT_URL, initTusk, track } from "../src/index"

const SITE_ID = "vt_3k9x2m7qpd4n8r1t"

afterEach(() => {
  document.head.innerHTML = ""
  delete (window as { viewtally?: unknown }).viewtally
  vi.restoreAllMocks()
})

const script = () =>
  document.querySelector<HTMLScriptElement>("script#tusk-analytics")

describe("initTusk", () => {
  it("adds the same script tag as the install snippet", () => {
    initTusk({ siteId: SITE_ID })

    expect(script()?.src).toBe(DEFAULT_SCRIPT_URL)
    expect(script()?.defer).toBe(true)
    expect(script()?.dataset.site).toBe(SITE_ID)
    expect(script()?.dataset.cookieless).toBeUndefined()
  })

  it("passes cookieless, localhost and a custom script URL through", () => {
    initTusk({
      siteId: SITE_ID,
      cookieless: true,
      allowLocalhost: true,
      scriptUrl: "https://stats.example.com/script.js",
    })

    expect(script()?.dataset.cookieless).toBe("true")
    expect(script()?.dataset.allowLocalhost).toBe("true")
    expect(script()?.src).toBe("https://stats.example.com/script.js")
  })

  it("adds the script only once however often it's called", () => {
    initTusk({ siteId: SITE_ID })
    initTusk({ siteId: SITE_ID })

    expect(document.querySelectorAll("script")).toHaveLength(1)
  })

  it("warns and adds nothing for something that isn't a site id", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

    initTusk({ siteId: "my-site" })

    expect(script()).toBeNull()
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe("track", () => {
  it("queues goals sent before the script loads, the way the script reads them", () => {
    track("signup")
    track("upgrade")

    const host = window as { viewtally?: { q?: unknown[][] } }
    expect(host.viewtally?.q).toEqual([["signup"], ["upgrade"]])
  })

  it("hands goals to the script once it has loaded", () => {
    const loaded = vi.fn()
    ;(window as { viewtally?: unknown }).viewtally = loaded

    track("signup")

    expect(loaded).toHaveBeenCalledWith("signup")
  })
})
