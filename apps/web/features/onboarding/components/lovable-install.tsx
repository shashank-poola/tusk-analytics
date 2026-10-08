"use client"

import { cn } from "@workspace/ui/lib/utils"
import { useId, useState } from "react"

import { BUTTON_CLASSES, INPUT_CLASSES } from "@/components/ui/button-styles"

import { lovableLink } from "@/features/onboarding/utils/snippets"

/**
 * Lovable's own link format opens the project with the install prompt
 * typed in (lovable.dev/projects/<id>?prompt=…); the person presses send.
 * "Copy prompt" covers Cursor, Bolt and other AI editors.
 */
export function LovableInstall({ prompt }: { prompt: string }) {
  const id = useId()
  const [projectUrl, setProjectUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const link = lovableLink(projectUrl, prompt)
  const invalid = projectUrl.trim() !== "" && !link

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
    } catch {
      // Denied: nothing to show; the Lovable link still works.
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor={`${id}-project`} className="sr-only">
        Lovable project link
      </label>
      <input
        id={`${id}-project`}
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="https://lovable.dev/projects/…"
        value={projectUrl}
        onChange={(event) => setProjectUrl(event.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={INPUT_CLASSES}
      />
      {invalid && (
        <p id={`${id}-error`} className="text-[13px] text-negative">
          That isn&apos;t a Lovable project link.
        </p>
      )}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(BUTTON_CLASSES.secondary, "w-full")}
        >
          Open in Lovable
        </a>
      ) : (
        <span
          aria-disabled="true"
          className={cn(
            BUTTON_CLASSES.secondary,
            "pointer-events-none w-full opacity-60"
          )}
        >
          Open in Lovable
        </span>
      )}
      <button
        type="button"
        onClick={copyPrompt}
        className="mx-auto block min-h-11 text-[13px] font-semibold text-link underline-offset-4 hover:underline sm:min-h-8"
      >
        {copied ? "Prompt copied" : "Copy prompt for another AI editor"}
      </button>
    </div>
  )
}
