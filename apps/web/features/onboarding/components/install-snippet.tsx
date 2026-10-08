"use client"

import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { useState } from "react"

import { BUTTON_CLASSES } from "@/components/ui/button-styles"

import type { Snippets } from "@/features/onboarding/utils/snippets"

type Framework = keyof Snippets

const FRAMEWORKS = ["html", "nextjs"] as const satisfies Framework[]

const TABS: Record<Framework, { label: string; pasteStep: string }> = {
  html: {
    label: "HTML",
    pasteStep: "Paste the snippet into the <head> of every page.",
  },
  nextjs: {
    label: "Next.js",
    pasteStep: "Add the snippet to your root layout, app/layout.tsx.",
  },
}

type CopyState = "idle" | "copied" | "failed"

type InstallSnippetProps = {
  snippets: Snippets
  continueHref: string
}

export function InstallSnippet({
  snippets,
  continueHref,
}: InstallSnippetProps) {
  const [framework, setFramework] = useState<Framework>("html")
  const [copyState, setCopyState] = useState<CopyState>("idle")
  const code = snippets[framework]

  function selectTab(next: Framework) {
    setFramework(next)
    setCopyState("idle")
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopyState("copied")
    } catch {
      // Clipboard access can be denied; the code stays selectable.
      setCopyState("failed")
    }
  }

  return (
    <div className="max-w-2xl">
      <div
        role="tablist"
        aria-label="Framework"
        className="flex gap-1 border-b border-border"
      >
        {FRAMEWORKS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`tab-${value}`}
            aria-selected={value === framework}
            aria-controls="snippet-panel"
            onClick={() => selectTab(value)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              value === framework
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {TABS[value].label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="snippet-panel"
        aria-labelledby={`tab-${framework}`}
        className="dark relative mt-4"
      >
        <pre className="overflow-x-auto rounded-2xl border-2 border-border bg-background p-4 pr-28 font-mono text-[0.8125rem] leading-relaxed text-foreground">
          <code>{code}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-3 right-3 rounded-xl border-2 border-border px-3 py-1 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          {copyState === "copied" ? "Copied" : "Copy snippet"}
        </button>
      </div>
      {copyState === "failed" && (
        <p role="alert" className="mt-2 text-sm text-negative">
          Couldn&apos;t copy. Select the code and copy it yourself.
        </p>
      )}

      <ol className="mt-8 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>{TABS[framework].pasteStep}</li>
        <li>Deploy your site.</li>
        <li>Visit your site so Tusk records the first pageview.</li>
      </ol>

      <Link href={continueHref} className={cn(BUTTON_CLASSES.primary, "mt-8")}>
        Continue
      </Link>
    </div>
  )
}
