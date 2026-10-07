import { cn } from "@workspace/ui/lib/utils"
import Image from "next/image"

/** Tusk, the blue hippo: the logo and the mascot on playful screens. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/company/logo.png"
      alt=""
      aria-hidden="true"
      width={128}
      height={128}
      className={cn("shrink-0", className)}
    />
  )
}

/** The mark and the "tusk" wordmark in Feather Bold. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <LogoMark className="size-12" />
      <span className="font-heading text-[1.75rem] leading-none font-bold [font-synthesis:none]">
        tusk
      </span>
    </span>
  )
}
