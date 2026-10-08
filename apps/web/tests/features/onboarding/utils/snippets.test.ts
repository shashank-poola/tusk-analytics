import { describe, expect, it } from "vitest"

import {
  buildSnippets,
  lovableLink,
} from "@/features/onboarding/utils/snippets"

const SITE = {
  siteId: "vt_3k9x2m7qpd4n8r1t",
  scriptUrl: "https://cdn.viewtally.com/script.js",
}

describe("buildSnippets", () => {
  it("builds a deferred script tag for plain HTML", () => {
    expect(buildSnippets(SITE).html).toBe(
      '<script defer data-site="vt_3k9x2m7qpd4n8r1t" src="https://cdn.viewtally.com/script.js"></script>'
    )
  })

  it("builds a next/script tag for the Next.js root layout", () => {
    expect(buildSnippets(SITE).nextjs).toBe(
      [
        "// app/layout.tsx",
        'import Script from "next/script"',
        "",
        "// Inside <body> of your root layout:",
        "<Script",
        '  src="https://cdn.viewtally.com/script.js"',
        '  data-site="vt_3k9x2m7qpd4n8r1t"',
        '  strategy="afterInteractive"',
        "/>",
      ].join("\n")
    )
  })
})

describe("buildSnippets in cookieless mode", () => {
  const COOKIELESS = { ...SITE, cookieless: true }

  it("adds data-cookieless to the script tag and the Next.js tag", () => {
    const snippets = buildSnippets(COOKIELESS)

    expect(snippets.html).toContain('data-cookieless="true"')
    expect(snippets.nextjs).toContain('  data-cookieless="true"')
  })

  it("passes cookieless to the npm package", () => {
    expect(buildSnippets(COOKIELESS).npm.code).toContain("cookieless: true")
    expect(buildSnippets(SITE).npm.code).not.toContain("cookieless")
  })
})

describe("npm and AI prompt snippets", () => {
  it("installs the package and starts it with the site id and script URL", () => {
    const { npm } = buildSnippets(SITE)

    expect(npm.install).toBe("npm i @usetusk/analytics")
    expect(npm.code).toContain('siteId: "vt_3k9x2m7qpd4n8r1t"')
    expect(npm.code).toContain(
      'scriptUrl: "https://cdn.viewtally.com/script.js"'
    )
  })

  it("asks an AI editor to add exactly the script tag", () => {
    const snippets = buildSnippets(SITE)

    expect(snippets.aiPrompt).toContain(snippets.html)
    expect(snippets.aiPrompt).toContain("Don't change anything else.")
  })
})

describe("lovableLink", () => {
  it("opens the project with the prompt typed in", () => {
    expect(
      lovableLink(
        "https://lovable.dev/projects/0a1b2c3d-4e5f/settings",
        "hi there"
      )
    ).toBe("https://lovable.dev/projects/0a1b2c3d-4e5f?prompt=hi%20there")
  })

  it("refuses anything that isn't a Lovable project link", () => {
    expect(
      lovableLink("https://evil.example/projects/0a1b2c3d", "x")
    ).toBeNull()
    expect(lovableLink("lovable.dev", "x")).toBeNull()
  })
})
