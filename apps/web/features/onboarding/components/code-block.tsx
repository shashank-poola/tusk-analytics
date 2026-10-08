"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"

type CopyState = "idle" | "copied" | "failed"

type CodeBlockProps = {
  /** Shown above the code, e.g. "index.html" or "Terminal". */
  label: string
  code: string
  /** Names the copy button for screen readers, e.g. "Copy snippet". */
  copyLabel?: string
}

/**
 * Code with its copy button in a header row above it, so the button never
 * covers the code. Always dark, like an editor.
 */
export function CodeBlock({
  label,
  code,
  copyLabel = "Copy snippet",
}: CodeBlockProps) {
  const [state, setState] = useState<CopyState>("idle")

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setState("copied")
    } catch {
      // Clipboard access can be denied; the code stays selectable.
      setState("failed")
    }
  }

  return (
    <div className="dark overflow-hidden rounded-2xl border-2 border-border bg-background text-foreground">
      <div className="flex items-center justify-between gap-3 border-b-2 border-border px-4 py-1.5">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:min-h-8"
        >
          {state === "copied" ? (
            <Check aria-hidden="true" className="size-4 text-positive" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
          {state === "copied" ? "Copied" : copyLabel}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
      {state === "failed" && (
        <p role="alert" className="px-4 pb-3 text-[13px] text-negative">
          Couldn&apos;t copy. Select the code and copy it yourself.
        </p>
      )}
    </div>
  )
}
