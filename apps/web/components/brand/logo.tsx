import { useId } from "react"

/** The Viewtally mark: a rounded tile with three rising bars cut out. */
export function LogoMark({ className }: { className?: string }) {
  const maskId = useId()

  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <mask id={maskId}>
        <rect width="32" height="32" fill="white" />
        <rect x="8" y="17" width="4" height="8" rx="1.5" fill="black" />
        <rect x="14" y="12" width="4" height="13" rx="1.5" fill="black" />
        <rect x="20" y="7" width="4" height="18" rx="1.5" fill="black" />
      </mask>
      <rect
        width="32"
        height="32"
        rx="8"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark className="size-7" />
      <span className="text-xl font-semibold tracking-tight">viewtally</span>
    </span>
  )
}
