import { cn } from "@workspace/ui/lib/utils"
import type { ComponentProps } from "react"

/**
 * Height of cards whose content varies (breakdowns, visitors), so empty,
 * half-full and full cards look the same and nothing below them jumps.
 * Fits 10 breakdown rows plus tabs and "Details", like DataFast's cards.
 */
export const FIXED_CARD_HEIGHT = "h-[31rem]"

/** The dashboard's surface: rounded, hairline border, soft lift. */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-[1.25rem] border border-border bg-surface shadow-card",
        className
      )}
      {...props}
    />
  )
}
