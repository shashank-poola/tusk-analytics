"use client"

import { cn } from "@workspace/ui/lib/utils"
import { useEffect, useRef, useState } from "react"

type SiteFaviconProps = {
  siteId: string
  domain: string
  className?: string
}

/**
 * The customer's own favicon, fetched by our API from their site (no third
 * party involved). Falls back to the domain's first letter when the site
 * has none or it can't be loaded.
 */
export function SiteFavicon({ siteId, domain, className }: SiteFaviconProps) {
  const [failed, setFailed] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // An error before hydration fires no onError, so check once on mount.
  useEffect(() => {
    const image = imageRef.current
    if (image?.complete && image.naturalWidth === 0) setFailed(true)
  }, [])
  const classes = cn("size-5 shrink-0 rounded-md", className)

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          classes,
          "grid place-items-center bg-accent text-[0.65rem] font-bold text-accent-foreground uppercase"
        )}
      >
        {domain[0]}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- served by our API, already small
    <img
      ref={imageRef}
      src={`/api/v1/sites/${siteId}/favicon`}
      alt=""
      onError={() => setFailed(true)}
      className={cn(classes, "bg-surface object-contain")}
    />
  )
}
