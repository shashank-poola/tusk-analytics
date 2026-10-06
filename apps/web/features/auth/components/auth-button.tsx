import type { ComponentProps } from "react"

const VARIANTS = {
  solid: "bg-foreground text-background hover:opacity-90",
  outline: "border border-border text-foreground hover:bg-muted",
}

type AuthButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof VARIANTS
}

/** The full-width pill buttons on the dark sign-in panel. */
export function AuthButton({
  variant = "solid",
  className,
  ...props
}: AuthButtonProps) {
  return (
    <button
      className={`flex h-11 w-full items-center justify-center gap-2.5 rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 sm:h-10 ${VARIANTS[variant]} ${className ?? ""}`}
      {...props}
    />
  )
}
