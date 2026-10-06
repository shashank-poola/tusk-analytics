import { cn } from "@workspace/ui/lib/utils"

import { TallyMarks } from "./tally-marks"

/** The Viewtally mark: a cobalt tile with a group of five tally marks. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-[28%] bg-accent text-accent-foreground",
        className
      )}
    >
      <TallyMarks className="size-[68%]" strokeWidth={2.4} />
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-7" />
      <span className="text-lg font-semibold tracking-tight">viewtally</span>
    </span>
  )
}
