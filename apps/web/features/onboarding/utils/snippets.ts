export type Snippets = {
  html: string
  nextjs: string
  npm: { install: string; code: string }
  /** For Lovable and AI code editors: what to add, and where. */
  aiPrompt: string
}

type SnippetInput = {
  siteId: string
  scriptUrl: string
  /** No cookies: `data-cookieless="true"` (see the tracker-script skill). */
  cookieless?: boolean
}

/**
 * The install snippets customers paste into their sites. They're a public
 * contract: once shipped, attributes can be added but never renamed.
 * `data-site` is what the tracker reads (see the tracker-script skill).
 */
export function buildSnippets({
  siteId,
  scriptUrl,
  cookieless = false,
}: SnippetInput): Snippets {
  const html = `<script defer data-site="${siteId}"${
    cookieless ? ` data-cookieless="true"` : ""
  } src="${scriptUrl}"></script>`
  return {
    html,
    nextjs: [
      `// app/layout.tsx`,
      `import Script from "next/script"`,
      ``,
      `// Inside <body> of your root layout:`,
      `<Script`,
      `  src="${scriptUrl}"`,
      `  data-site="${siteId}"`,
      ...(cookieless ? [`  data-cookieless="true"`] : []),
      `  strategy="afterInteractive"`,
      `/>`,
    ].join("\n"),
    npm: {
      install: "npm i @usetusk/analytics",
      code: [
        `import { initTusk } from "@usetusk/analytics"`,
        ``,
        `initTusk({`,
        `  siteId: "${siteId}",`,
        ...(cookieless ? [`  cookieless: true,`] : []),
        `  scriptUrl: "${scriptUrl}",`,
        `})`,
      ].join("\n"),
    },
    aiPrompt: [
      `Add Tusk analytics to this site. Put this script tag inside the <head> of index.html (or the root layout) so it loads on every page:`,
      ``,
      html,
      ``,
      `Don't change anything else.`,
    ].join("\n"),
  }
}

const LOVABLE_PROJECT =
  /^https:\/\/(?:www\.)?lovable\.dev\/projects\/([\w-]{8,64})/

/**
 * A link that opens the person's Lovable project with `prompt` typed into
 * its chat (they still press send), or null for anything that isn't a
 * Lovable project link.
 */
export function lovableLink(projectUrl: string, prompt: string): string | null {
  const projectId = LOVABLE_PROJECT.exec(projectUrl.trim())?.[1]
  if (!projectId) return null
  return `https://lovable.dev/projects/${projectId}?prompt=${encodeURIComponent(prompt)}`
}
