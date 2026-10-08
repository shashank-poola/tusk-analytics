"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"

type CopyState = "idle" | "copied" | "failed"

type CodeBlockProps = {
  /** Shown above the code, e.g. "app/layout.tsx". */
  label: string
  code: string
}

/**
 * Code with a small copy button in a slim header row, so the button never
 * covers the code. Always dark, like an editor.
 */
export function CodeBlock({ label, code }: CodeBlockProps) {
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
    <div className="dark overflow-hidden rounded-xl border-2 border-border bg-background text-foreground">
      <div className="flex items-center justify-between gap-3 border-b-2 border-border pr-1 pl-3.5">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={state === "copied" ? `Copied ${label}` : `Copy ${label}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:min-h-8"
        >
          {state === "copied" ? (
            <Check aria-hidden="true" className="size-3.5 text-positive" />
          ) : (
            <Copy aria-hidden="true" className="size-3.5" />
          )}
          {state === "copied" ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-relaxed">
        <code>{code}</code>
      </pre>
      {state === "failed" && (
        <p role="alert" className="px-3.5 pb-2.5 text-[12px] text-negative">
          Couldn&apos;t copy. Select the code instead.
        </p>
      )}
    </div>
  )
}
