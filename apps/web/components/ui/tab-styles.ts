import { cn } from "@workspace/ui/lib/utils"

// Kept out of any "use client" module so server components can import the
// strings (see menu-styles.ts).

/** The pills' track: a quiet muted bar. */
export const TAB_TRACK_CLASSES = "inline-flex gap-0.5 rounded-xl bg-muted p-1"

/** A pill on the track; the open one is raised on the surface colour. */
export function tabClasses(active: boolean): string {
  return cn(
    "inline-flex h-11 items-center rounded-lg px-3 text-[0.8125rem] font-medium whitespace-nowrap transition-colors sm:h-7",
    active
      ? "bg-surface text-foreground shadow-card"
      : "text-muted-foreground hover:text-foreground"
  )
}
