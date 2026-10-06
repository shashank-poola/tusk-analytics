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
  /** Classes for the dropdown, e.g. a narrower width. */
  panelClassName?: string
  /** Classes for the wrapper, e.g. "h-full" to fill a pill. */
  className?: string
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
  panelClassName,
  className,
  children,
}: MenuProps) {
  const ref = useRef<HTMLDetailsElement>(null)
  useDismiss(ref)

  return (
    <details ref={ref} className={cn("group relative", className)}>
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
          "absolute z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] animate-rise rounded-xl border border-border bg-surface p-1 shadow-pop",
          align === "end" ? "right-0" : "left-0",
          panelClassName
        )}
      >
        {children}
      </div>
    </details>
  )
}
