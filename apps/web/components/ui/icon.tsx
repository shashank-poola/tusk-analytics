"use client"

import { knownSourceName, sourceForHost } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"

type IconType = "referrer" | "browser" | "os" | "device" | "country"

const DIRECTORIES: Record<Exclude<IconType, "referrer">, string> = {
  browser: "browsers",
  os: "os",
  device: "devices",
  country: "flags",
}

// Black logos that vanish on a dark background: flipped to white there.
const BLACK_ICONS = new Set([
  "/icons/os/macos.svg",
  "/icons/os/ios.svg",
  "/icons/referrers/x.svg",
  "/icons/referrers/github.svg",
])

const GENERIC = "/icons/generic.svg"
const GENERIC_LINK = "/icons/generic-link.svg"

// Names are tracker input: only these shapes ever reach a URL.
const SLUG = /^[a-z0-9-]{1,64}$/
const HOSTNAME = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/

function referrerSrc(name: string): string {
  const source = knownSourceName(name) ? name : sourceForHost(name)
  if (source) return `/icons/referrers/${source}.svg`
  // Tells Google the domain; see docs/design/dashboard.md.
  if (HOSTNAME.test(name)) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(name)}&sz=32`
  }
  return GENERIC_LINK
}

function iconSrc(type: IconType, name: string): string {
  if (type === "referrer") return referrerSrc(name)
  return SLUG.test(name) ? `/icons/${DIRECTORIES[type]}/${name}.svg` : GENERIC
}

type IconProps = {
  type: IconType
  /** A stored slug (`chrome`), country code (`IN`), source or hostname. */
  name: string | null | undefined
  className?: string
}

/** A 20×20 static icon, or a generic one when the file is missing. */
export function Icon({ type, name, className }: IconProps) {
  const src = iconSrc(type, name?.toLowerCase() ?? "")
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVGs and favicons need no optimizer
    <img
      src={
        failedSrc === src ? (type === "referrer" ? GENERIC_LINK : GENERIC) : src
      }
      alt=""
      width={20}
      height={20}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      className={cn(
        "size-5 shrink-0 rounded-[4px] object-contain",
        BLACK_ICONS.has(src) && "dark:invert",
        className
      )}
    />
  )
}
