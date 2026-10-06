"use client"

import { cn } from "@workspace/ui/lib/utils"
import { useRef } from "react"

import { useDismiss } from "@/hooks/use-dismiss"

type MenuProps = {
  /** Contents of the toggle button. */
  trigger: React.ReactNode
  /** Accessible name of the toggle when `trigger` has no text. */
  label?: string
  align?: "start" | "end"
  /** Classes for the toggle, e.g. "p-0" when the trigger draws its own chip. */
  triggerClassName?: string
  children: React.ReactNode
}

/**
 * A disclosure menu on <details>: works before hydration, opens with Enter
 * or Space, and closes on Escape or a click outside.
 */
export function Menu({
  trigger,
  label,
  align = "start",
  triggerClassName,
  children,
}: MenuProps) {
  const ref = useRef<HTMLDetailsElement>(null)
  useDismiss(ref)

  return (
    <details ref={ref} className="group relative">
      <summary
        aria-label={label}
        className={cn(
          "flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full px-2 transition-colors hover:bg-muted sm:min-h-9 [&::-webkit-details-marker]:hidden",
          triggerClassName
        )}
      >
        {trigger}
      </summary>
      {/* Client-side navigation keeps the menu mounted, so a chosen link
          closes it. Enter on a link fires click too. */}
      <div
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) {
            if (ref.current) ref.current.open = false
          }
        }}
        className={cn(
          "absolute z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] animate-rise rounded-2xl border border-border bg-surface p-1.5 shadow-pop",
          align === "end" ? "right-0" : "left-0"
        )}
      >
        {children}
      </div>
    </details>
  )
}

/** A row in a Menu, for links and buttons alike. */
export const MENU_ITEM_CLASSES =
  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors hover:bg-muted sm:min-h-10"
