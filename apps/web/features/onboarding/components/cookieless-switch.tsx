"use client"

import { cn } from "@workspace/ui/lib/utils"
import { useId } from "react"

import { Icon } from "@/components/ui/icon"

// The trade-off, for screen readers and as a hover hint: it matters, but
// not enough to fill the card.
const HINT =
  "No cookies at all. Best for single-page apps: on multi-page sites every page load counts as a new visitor."

/** One line above the snippet: turns every snippet cookieless. */
export function CookielessSwitch({
  on,
  onChange,
}: {
  on: boolean
  onChange: (on: boolean) => void
}) {
  const id = useId()
  return (
    <div>
      <label
        title={HINT}
        className="flex w-fit cursor-pointer items-center gap-2.5 text-[13px] font-semibold"
      >
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-describedby={`${id}-hint`}
          onClick={() => onChange(!on)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
            on ? "bg-accent" : "bg-border"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-card transition-transform",
              on && "translate-x-4"
            )}
          />
        </button>
        Cookieless tracking
        <Icon type="country" name="eu" className="size-3.5" />
      </label>
      <span id={`${id}-hint`} className="sr-only">
        {HINT}
      </span>
    </div>
  )
}
