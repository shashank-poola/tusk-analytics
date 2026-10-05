export type Snippets = {
  html: string
  nextjs: string
}

/**
 * The install snippets customers paste into their sites. They're a public
 * contract: once shipped, attributes can be added but never renamed.
 * `data-site` is what the tracker reads (see the tracker-script skill).
 */
export function buildSnippets({
  siteId,
  scriptUrl,
}: {
  siteId: string
  scriptUrl: string
}): Snippets {
  return {
    html: `<script defer data-site="${siteId}" src="${scriptUrl}"></script>`,
    nextjs: [
      `// app/layout.tsx`,
      `import Script from "next/script"`,
      ``,
      `// Inside <body> of your root layout:`,
      `<Script`,
      `  src="${scriptUrl}"`,
      `  data-site="${siteId}"`,
      `  strategy="afterInteractive"`,
      `/>`,
    ].join("\n"),
  }
}
