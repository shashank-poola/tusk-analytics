import { cn } from "@workspace/ui/lib/utils"
import type { ComponentProps } from "react"

/**
 * Height of cards whose content varies (breakdowns, visitors), so empty,
 * half-full and full cards look the same and nothing below them jumps.
 * Fits 8 breakdown rows plus tabs and "Details".
 */
export const FIXED_CARD_HEIGHT = "h-[28rem]"

/** The dashboard's surface: rounded, hairline border, soft lift. */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border bg-surface shadow-card",
        className
      )}
      {...props}
    />
  )
}
