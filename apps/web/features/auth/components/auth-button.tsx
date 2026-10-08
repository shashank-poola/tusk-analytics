import { cn } from "@workspace/ui/lib/utils"
import type { ComponentProps } from "react"

import { BUTTON_CLASSES } from "@/components/ui/button-styles"

type AuthButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary"
}

/** The full-width buttons on the sign-in panel. */
export function AuthButton({
  variant = "primary",
  className,
  ...props
}: AuthButtonProps) {
  return (
    <button
      className={cn(BUTTON_CLASSES[variant], "w-full gap-2.5", className)}
      {...props}
    />
  )
}
