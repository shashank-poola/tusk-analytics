"use client"

import { cn } from "@workspace/ui/lib/utils"
import { useId } from "react"

import { Icon } from "@/components/ui/icon"

/** On top of the install tabs: turns every snippet cookieless. */
export function CookielessSwitch({
  on,
  onChange,
}: {
  on: boolean
  onChange: (on: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted p-3.5">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        onClick={() => onChange(!on)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-10 shrink-0 rounded-full transition-colors",
          on ? "bg-accent" : "bg-border"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-card transition-transform",
            on && "translate-x-4"
          )}
        />
      </button>
      <div>
        <p
          id={`${id}-label`}
          className="flex items-center gap-2 text-[15px] font-semibold"
        >
          Cookieless mode
          <Icon type="country" name="eu" className="size-4" />
        </p>
        <p
          id={`${id}-hint`}
          className="mt-0.5 text-[13px] text-muted-foreground"
        >
          No cookies at all. Best for single-page apps: on multi-page sites
          every page load counts as a new visitor.
        </p>
      </div>
    </div>
  )
}
