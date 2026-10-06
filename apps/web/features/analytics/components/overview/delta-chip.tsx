import { cn } from "@workspace/ui/lib/utils"
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"

import type { Change } from "@/features/analytics/utils/format"

const ARROWS = { up: ArrowUp, down: ArrowDown, flat: ArrowRight } as const

type DeltaChipProps = {
  change: Change
  /** Bounce rate: going up is bad news. */
  lowerIsBetter?: boolean
}

/**
 * Change versus the previous period as an arrow, a signed number and words.
 * Colour only repeats what the arrow and sign already say.
 */
export function DeltaChip({ change, lowerIsBetter = false }: DeltaChipProps) {
  if (change.direction === "none") {
    return (
      <span className="inline-flex h-6 items-center rounded-full bg-muted px-2 text-xs text-muted-foreground">
        <span aria-hidden="true">–</span>
        <span className="sr-only">No data for the previous period</span>
      </span>
    )
  }

  const Arrow = ARROWS[change.direction]
  const good =
    change.direction !== "flat" && (change.direction === "up") !== lowerIsBetter
  const bad = change.direction !== "flat" && !good
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium tabular-nums",
        good && "bg-positive/12 text-positive",
        bad && "bg-negative/12 text-negative",
        change.direction === "flat" && "bg-muted text-muted-foreground"
      )}
    >
      <Arrow aria-hidden="true" className="size-3" strokeWidth={2.5} />
      {change.text}
      <span className="sr-only"> versus the previous period</span>
    </span>
  )
}
