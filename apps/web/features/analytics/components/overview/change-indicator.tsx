import { cn } from "@workspace/ui/lib/utils"
import { ArrowDown, ArrowUp } from "lucide-react"

import type { Change } from "@/features/analytics/utils/format"

type ChangeIndicatorProps = {
  change: Change
  /** Bounce rate: going up is bad news. */
  lowerIsBetter?: boolean
}

/**
 * "38% ↑" versus the previous period, as on DataFast: the number in grey,
 * the arrow coloured by whether the change is good. Colour only repeats
 * what the arrow says; screen readers get "up 38%".
 */
export function ChangeIndicator({
  change,
  lowerIsBetter = false,
}: ChangeIndicatorProps) {
  if (change.direction === "none") {
    return (
      <span className="h-4 text-xs text-muted-foreground">
        <span aria-hidden="true">–</span>
        <span className="sr-only">No data for the previous period</span>
      </span>
    )
  }
  const good =
    change.direction !== "flat" && (change.direction === "up") !== lowerIsBetter
  const Arrow = change.direction === "down" ? ArrowDown : ArrowUp
  return (
    <span className="inline-flex h-4 items-center gap-1 text-xs font-medium text-muted-foreground tabular-nums">
      <span className="sr-only">
        {change.direction === "flat" ? "unchanged at" : change.direction}{" "}
      </span>
      {change.text}
      {change.direction !== "flat" && (
        <Arrow
          aria-hidden="true"
          strokeWidth={2.5}
          className={cn("size-3", good ? "text-positive" : "text-negative")}
        />
      )}
      <span className="sr-only"> versus the previous period</span>
    </span>
  )
}
