import { describe, expect, it } from "vitest"

import { buildSnippets } from "@/lib/snippets"

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
