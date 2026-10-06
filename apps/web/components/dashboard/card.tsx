import { cn } from "@workspace/ui/lib/utils"
import type { ComponentProps } from "react"

/** The dashboard's surface: rounded, hairline border, soft lift. */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-card",
        className
      )}
      {...props}
    />
  )
}
