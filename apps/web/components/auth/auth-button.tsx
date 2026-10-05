import type { ComponentProps } from "react"

const VARIANTS = {
  solid: "bg-white text-neutral-950 hover:bg-neutral-200",
  outline: "border border-white/20 text-white hover:bg-white/5",
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
      className={`flex h-10 w-full items-center justify-center gap-2.5 rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 ${VARIANTS[variant]} ${className ?? ""}`}
      {...props}
    />
  )
}
