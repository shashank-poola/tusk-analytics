"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Heart } from "lucide-react"
import { useId, useState } from "react"

import { BUTTON_CLASSES, INPUT_CLASSES } from "@/components/ui/button-styles"

import { lovableLink } from "@/features/onboarding/utils/snippets"
import { CodeBlock } from "./code-block"
import { InstallHint } from "./install-hint"

/**
 * Lovable's own link format opens the project with the prompt typed in
 * (lovable.dev/projects/<id>?prompt=…); the person still presses send.
 * The same prompt works in Cursor, Bolt or any AI editor.
 */
export function LovableInstall({ prompt }: { prompt: string }) {
  const id = useId()
  const [projectUrl, setProjectUrl] = useState("")
  const link = lovableLink(projectUrl, prompt)
  const showError = projectUrl.trim() !== "" && !link

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${id}-project`} className="text-[15px] font-semibold">
          Your Lovable project link
        </label>
        <input
          id={`${id}-project`}
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://lovable.dev/projects/…"
          value={projectUrl}
          onChange={(event) => setProjectUrl(event.target.value)}
          aria-invalid={showError || undefined}
          aria-describedby={`${id}-project-hint`}
          className={cn(INPUT_CLASSES, "mt-1.5")}
        />
        <p
          id={`${id}-project-hint`}
          className={cn(
            "mt-1.5 text-[13px]",
            showError ? "text-negative" : "text-muted-foreground"
          )}
        >
          {showError
            ? "That isn't a Lovable project link. Copy it from your browser's address bar in Lovable."
            : "Open your project in Lovable and copy the address from your browser."}
        </p>
      </div>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(BUTTON_CLASSES.secondary, "w-full")}
        >
          <Heart aria-hidden="true" className="size-4" />
          Open in Lovable with the prompt
        </a>
      ) : (
        <span
          aria-disabled="true"
          className={cn(
            BUTTON_CLASSES.secondary,
            "pointer-events-none w-full opacity-60"
          )}
        >
          <Heart aria-hidden="true" className="size-4" />
          Open in Lovable with the prompt
        </span>
      )}
      <InstallHint>
        Then press send in Lovable. Using Cursor, Bolt or v0? Copy the same
        prompt:
      </InstallHint>
      <CodeBlock label="Prompt" code={prompt} copyLabel="Copy prompt" />
    </div>
  )
}
