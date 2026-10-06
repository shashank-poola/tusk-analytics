import { createDb, eq, insertSite, sites } from "@workspace/db"
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test"
import { env } from "cloudflare:workers"
import { afterEach, describe, expect, it, vi } from "vitest"

import { isFetchableUrl } from "../src/api/v1/sites/favicon-http"
import { findIconUrls } from "../src/api/v1/sites/favicon-links"
import { MAX_ICON_BYTES } from "../src/api/v1/sites/site-favicon"
import { app } from "../src/app"
import { createSite, signIn } from "./helpers"

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function html(head: string) {
  return new Response(`<!doctype html><html><head>${head}</head></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

function image(bytes: Uint8Array | ReadableStream, contentType: string) {
  return new Response(bytes, { headers: { "Content-Type": contentType } })
}

const notFound = () => new Response("Not found", { status: 404 })

function redirect(location: string, status = 302) {
  return new Response(null, { status, headers: { Location: location } })
}

/**
 * Mocks outbound fetch with one response per URL; any other URL answers 404.
 * Install it after `signIn()`, which mocks fetch itself.
 */
function mockSiteResponses(responses: Record<string, () => Response>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = input instanceof Request ? input.url : String(input)
    return (responses[url] ?? notFound)()
  })
}

function requestedUrls(fetchSpy: ReturnType<typeof mockSiteResponses>) {
  return fetchSpy.mock.calls.map(([input]) =>
    input instanceof Request ? input.url : String(input)
  )
}

async function ownerWithSite() {
  const owner = await signIn()
  const site = await createSite(owner.userId)
  return { owner, site, home: `https://${site.domain}/` }
}

/** Waits for the response and for the cache write it scheduled. */
async function getFavicon(siteId: string, cookie?: string) {
  const ctx = createExecutionContext()
  const res = await app.request(
    `/api/v1/sites/${siteId}/favicon`,
    { headers: cookie ? { Cookie: cookie } : {} },
    env,
    ctx
  )
  await waitOnExecutionContext(ctx)
  return res
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("findIconUrls", () => {
  const page = new URL("https://example.com/blog/")

  it("resolves a relative href against the page URL", () => {
    const urls = findIconUrls('<link rel="icon" href="img/icon.png">', page)

    expect(urls.map(String)).toEqual(["https://example.com/blog/img/icon.png"])
  })

  it("reads attributes in any order and with any quoting", () => {
    const urls = findIconUrls(
      "<LINK HREF=/a.ico REL='shortcut icon'><link href=\"/b.png\" rel=icon />",
      page
    )

    expect(urls.map(String)).toEqual([
      "https://example.com/b.png",
      "https://example.com/a.ico",
    ])
  })

  it("prefers an svg icon, then a sized png, then an apple-touch-icon, then a bare ico", () => {
    const urls = findIconUrls(
      [
        '<link rel="apple-touch-icon" href="/touch.png" sizes="180x180">',
        '<link rel="icon" href="/favicon.ico">',
        '<link rel="icon" type="image/png" sizes="32x32" href="/32.png">',
        '<link rel="icon" type="image/svg+xml" href="/icon.svg">',
      ].join(""),
      page
    )

    expect(urls.map((url) => url.pathname)).toEqual([
      "/icon.svg",
      "/32.png",
      "/touch.png",
      "/favicon.ico",
    ])
  })

  it("ignores stylesheets, mask icons and data:, javascript: or empty hrefs", () => {
    const urls = findIconUrls(
      [
        '<link rel="stylesheet" href="/style.css">',
        '<link rel="mask-icon" href="/mask.svg">',
        '<link rel="icon" href="data:image/png;base64,AAAA">',
        '<link rel="icon" href="javascript:alert(1)">',
        '<link rel="icon" href="">',
        "<link rel=icon>",
      ].join(""),
      page
    )

    expect(urls).toEqual([])
  })

  // workerd freezes clocks during synchronous code, so this can't time the
  // scan; it guards against a regex that never finishes. The {0,2048} bound
  // keeps this input to ~30 ms in V8.
  it("finishes scanning 64 KB of unclosed <link tags", () => {
    const hostile = "<link".repeat((64 * 1024) / 5)

    expect(findIconUrls(hostile, page)).toEqual([])
  })

  it("stops after a bounded number of link tags", () => {
    const stylesheets = '<link rel="stylesheet" href="/s.css">'.repeat(300)

    const urls = findIconUrls(
      `${stylesheets}<link rel="icon" href="/late.png">`,
      page
    )

    expect(urls).toEqual([])
  })

  it("decodes &amp; in the href", () => {
    const urls = findIconUrls(
      '<link rel="icon" href="/icon.png?v=2&amp;s=32">',
      page
    )

    expect(urls.map(String)).toEqual(["https://example.com/icon.png?v=2&s=32"])
  })

  it("follows an absolute href to another host", () => {
    const urls = findIconUrls(
      '<link rel="icon" href="//cdn.example.net/icon.png">',
      page
    )

    expect(urls.map(String)).toEqual(["https://cdn.example.net/icon.png"])
  })
})

describe("GET /api/v1/sites/:siteId/favicon", () => {
  it("serves the icon the home page links to, resolved relative to the page", async () => {
    const { owner, site, home } = await ownerWithSite()
    const fetchSpy = mockSiteResponses({
      [home]: () =>
        html('<link rel="icon" type="image/png" href="static/icon.png">'),
      [`${home}static/icon.png`]: () => image(PNG, "image/png"),
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(200)
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG)
    expect(requestedUrls(fetchSpy)).toEqual([home, `${home}static/icon.png`])
  })

  it("answers with headers that keep the icon inert on our origin", async () => {
    const { owner, site, home } = await ownerWithSite()
    mockSiteResponses({
      [home]: () => html('<link rel="icon" href="/icon.svg">'),
      [`${home}icon.svg`]: () =>
        image(
          new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"),
          "image/svg+xml; charset=utf-8"
        ),
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(200)
    expect(Object.fromEntries(res.headers)).toMatchObject({
      "content-type": "image/svg+xml",
      "cache-control": "private, max-age=86400",
      "x-content-type-options": "nosniff",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "content-disposition": 'inline; filename="favicon"',
    })
  })

  it("falls back to /favicon.ico when the home page links no icon", async () => {
    const { owner, site, home } = await ownerWithSite()
    const fetchSpy = mockSiteResponses({
      [home]: () => html("<title>No icon here</title>"),
      [`${home}favicon.ico`]: () => image(PNG, "image/x-icon"),
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("image/x-icon")
    expect(requestedUrls(fetchSpy)).toEqual([home, `${home}favicon.ico`])
  })

  it("falls back to /favicon.ico when the home page can't be fetched", async () => {
    const { owner, site, home } = await ownerWithSite()
    vi.spyOn(console, "warn").mockImplementation(() => {})
    mockSiteResponses({
      [home]: () => {
        throw new TypeError("Network connection lost")
      },
      [`${home}favicon.ico`]: () => image(PNG, "image/vnd.microsoft.icon"),
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(200)
  })

  it("answers 404 and logs the site id when the icon isn't an image", async () => {
    const { owner, site, home } = await ownerWithSite()
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    mockSiteResponses({
      [home]: () => html('<link rel="icon" href="/icon.png">'),
      [`${home}icon.png`]: () => html("<p>Soft 404</p>"),
      [`${home}favicon.ico`]: () => html("<p>Soft 404</p>"),
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: { code: "not_found" } })
    expect(warn).toHaveBeenCalledOnce()
    expect(String(warn.mock.lastCall?.[0])).toContain(site.id)
  })

  it("answers 404 when the icon declares a size over the limit", async () => {
    const { owner, site, home } = await ownerWithSite()
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    mockSiteResponses({
      [`${home}favicon.ico`]: () =>
        new Response(PNG, {
          headers: {
            "Content-Type": "image/png",
            "Content-Length": String(MAX_ICON_BYTES + 1),
          },
        }),
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(404)
    expect(String(warn.mock.lastCall?.[0])).toContain(
      `content-length ${MAX_ICON_BYTES + 1}`
    )
  })

  it("answers 404 when the icon streams more bytes than the limit", async () => {
    const { owner, site, home } = await ownerWithSite()
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const chunk = new Uint8Array(64 * 1024)
    mockSiteResponses({
      [`${home}favicon.ico`]: () => {
        let sent = 0
        const body = new ReadableStream<Uint8Array>({
          pull(controller) {
            sent += chunk.length
            controller.enqueue(chunk)
            if (sent > MAX_ICON_BYTES * 2) controller.close()
          },
        })
        return image(body, "image/png")
      },
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(404)
    expect(String(warn.mock.lastCall?.[0])).toContain(
      `/favicon.ico: larger than ${MAX_ICON_BYTES} bytes`
    )
  })

  it("answers 404 without fetching anything for a localhost site", async () => {
    const owner = await signIn()
    const site = await insertSite(createDb(env.DB), {
      ownerId: owner.userId,
      name: "Local",
      domain: "localhost",
      timezone: "UTC",
    })
    if (!site) throw new Error("Failed to create site")
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const fetchSpy = mockSiteResponses({})

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(404)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("answers 404 without fetching anything when user B asks for user A's site", async () => {
    const { site } = await ownerWithSite()
    const userB = await signIn()
    const fetchSpy = mockSiteResponses({})

    const res = await getFavicon(site.id, userB.cookie)

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      error: { code: "not_found", message: "Site not found" },
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("answers 401 when signed out", async () => {
    const { site } = await ownerWithSite()

    const res = await getFavicon(site.id)

    expect(res.status).toBe(401)
  })
})

describe("favicon cache", () => {
  it("serves the second request from the cache without fetching", async () => {
    const { owner, site, home } = await ownerWithSite()
    mockSiteResponses({
      [home]: () => html("<title>No icon link</title>"),
      [`${home}favicon.ico`]: () => image(PNG, "image/x-icon"),
    })
    expect((await getFavicon(site.id, owner.cookie)).status).toBe(200)
    vi.restoreAllMocks()
    const fetchSpy = mockSiteResponses({})

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(200)
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG)
    expect(res.headers.get("content-type")).toBe("image/x-icon")
    expect(res.headers.get("content-security-policy")).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; sandbox"
    )
    expect(res.headers.get("cache-control")).toBe("private, max-age=86400")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("remembers a site without a favicon and answers 404 again without fetching", async () => {
    const { owner, site } = await ownerWithSite()
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const fetchSpy = mockSiteResponses({})
    expect((await getFavicon(site.id, owner.cookie)).status).toBe(404)
    fetchSpy.mockClear()

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: { code: "not_found" } })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledOnce()
  })

  it("fetches again once the site's domain changes", async () => {
    const { owner, site, home } = await ownerWithSite()
    mockSiteResponses({ [`${home}favicon.ico`]: () => image(PNG, "image/png") })
    expect((await getFavicon(site.id, owner.cookie)).status).toBe(200)
    const newDomain = `new-${site.domain}`
    await createDb(env.DB)
      .update(sites)
      .set({ domain: newDomain })
      .where(eq(sites.id, site.id))
    const fetchSpy = mockSiteResponses({
      [`https://${newDomain}/favicon.ico`]: () => image(PNG, "image/gif"),
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.headers.get("content-type")).toBe("image/gif")
    expect(fetchSpy).toHaveBeenCalled()
  })
})

describe("isFetchableUrl", () => {
  it.each([
    "https://example.com/favicon.ico",
    "https://cdn.example.net/a/icon.png?v=2",
    "https://xn--bcher-kva.example/icon.svg",
  ])("allows %s", (url) => {
    expect(isFetchableUrl(new URL(url))).toBe(true)
  })

  it.each([
    "http://example.com/icon.png",
    "https://example.com:8443/icon.png",
    "https://user:pass@example.com/icon.png",
    "https://127.0.0.1/icon.png",
    "https://2130706433/icon.png",
    "https://[::1]/icon.png",
    "https://localhost/icon.png",
    "https://x.localhost/icon.png",
    "https://printer.local/icon.png",
    "https://metadata.google.internal/icon.png",
    "https://router.home.arpa/icon.png",
    "https://intranet/icon.png",
  ])("refuses %s", (url) => {
    expect(isFetchableUrl(new URL(url))).toBe(false)
  })
})

describe("favicon fetching refuses non-public URLs", () => {
  it.each([
    ["an IP literal", "https://127.0.0.1/icon.png"],
    ["a .localhost host", "https://x.localhost/icon.png"],
    ["plain http", "http://HOST/icon.png"],
    ["a non-default port", "https://HOST:8443/icon.png"],
  ])(
    "skips an icon link to %s and falls back to /favicon.ico",
    async (_, href) => {
      const { owner, site, home } = await ownerWithSite()
      const iconHref = href.replace("HOST", site.domain)
      const fetchSpy = mockSiteResponses({
        [home]: () => html(`<link rel="icon" href="${iconHref}">`),
        [`${home}favicon.ico`]: () => image(PNG, "image/x-icon"),
      })

      const res = await getFavicon(site.id, owner.cookie)

      expect(res.status).toBe(200)
      expect(requestedUrls(fetchSpy)).toEqual([home, `${home}favicon.ico`])
    }
  )

  it("never follows a redirect to an IP address", async () => {
    const { owner, site, home } = await ownerWithSite()
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const fetchSpy = mockSiteResponses({
      [home]: () => redirect("https://10.0.0.1/"),
      [`${home}favicon.ico`]: () =>
        redirect("https://169.254.169.254/latest/meta-data/"),
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(404)
    expect(requestedUrls(fetchSpy)).toEqual([home, `${home}favicon.ico`])
  })

  it("follows a relative redirect and resolves icon links against the final URL", async () => {
    const { owner, site, home } = await ownerWithSite()
    const fetchSpy = mockSiteResponses({
      [home]: () => redirect("/en/", 301),
      [`${home}en/`]: () => html('<link rel="icon" href="icon.png">'),
      [`${home}en/icon.png`]: () => image(PNG, "image/png"),
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(200)
    expect(requestedUrls(fetchSpy)).toEqual([
      home,
      `${home}en/`,
      `${home}en/icon.png`,
    ])
  })

  it("answers 404 after more than three redirects", async () => {
    const { owner, site, home } = await ownerWithSite()
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const fetchSpy = mockSiteResponses({
      [`${home}favicon.ico`]: () => redirect("/r1"),
      [`${home}r1`]: () => redirect("/r2"),
      [`${home}r2`]: () => redirect("/r3"),
      [`${home}r3`]: () => redirect("/r4"),
      [`${home}r4`]: () => image(PNG, "image/png"),
    })

    const res = await getFavicon(site.id, owner.cookie)

    expect(res.status).toBe(404)
    expect(requestedUrls(fetchSpy)).not.toContain(`${home}r4`)
    expect(String(warn.mock.lastCall?.[0])).toContain("more than 3 redirects")
  })
})
