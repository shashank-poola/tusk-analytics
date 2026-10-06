import { cn } from "@workspace/ui/lib/utils"

type AvatarProps = {
  /** A data URI from `lib/avatar.ts` or the provider's https photo. */
  src: string
  /** Empty when the name is already next to it. */
  alt?: string
  className?: string
}

/** A round face. Plain <img>: data URIs and provider photos need no optimizer. */
export function Avatar({ src, alt = "", className }: AvatarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see above
    <img
      src={src}
      alt={alt}
      // Google photos refuse some cross-site referrers.
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      className={cn(
        "size-8 shrink-0 rounded-full bg-muted object-cover ring-1 ring-border",
        className
      )}
    />
  )
}
