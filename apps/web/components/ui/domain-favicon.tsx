"use client"

import { domainSchema } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { Globe } from "lucide-react"
import { preconnect } from "react-dom"

import { Icon } from "./icon"

const FAVICON_ORIGIN = "https://www.google.com"

type DomainFaviconProps = {
  /** What the person typed, e.g. "https://www.myapp.com/pricing". */
  value: string
  className?: string
}

/**
 * The site's icon for a domain field, swapped in on the keystroke that
 * makes the domain valid: well-known sites from our own SVGs, others from
 * Google's favicon service (connected ahead of time); a globe until then.
 */
export function DomainFavicon({ value, className }: DomainFaviconProps) {
  preconnect(FAVICON_ORIGIN)
  const domain = domainSchema.safeParse(value)
  return domain.success ? (
    <Icon type="referrer" name={domain.data} className={className} />
  ) : (
    <Globe
      aria-hidden="true"
      className={cn("text-muted-foreground", className)}
    />
  )
}
