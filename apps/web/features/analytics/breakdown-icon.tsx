import type { BreakdownBy } from "@workspace/contracts"
import {
  Code,
  FileText,
  Globe,
  Link,
  type LucideIcon,
  MessagesSquare,
  Monitor,
  MousePointerClick,
  Newspaper,
  Search,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react"

import { countryFlag, type SourceKind, sourceKind } from "./labels"

// Category icons only: no favicons or brand logos, which would mean asking a
// third party about our customers' referrers.

const SOURCE_ICONS: Record<SourceKind, LucideIcon> = {
  direct: MousePointerClick,
  search: Search,
  social: MessagesSquare,
  community: Newspaper,
  code: Code,
  ai: Sparkles,
  other: Link,
}

const DEVICE_ICONS: Record<string, LucideIcon> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
}

const ICON_CLASSES = "size-4 shrink-0 text-muted-foreground"

/** Null for browsers and operating systems, which get a monogram. */
function lucideIcon(
  by: Exclude<BreakdownBy, "country">,
  key: string
): LucideIcon | null {
  switch (by) {
    case "source":
      return SOURCE_ICONS[sourceKind(key)]
    case "page":
      return FileText
    case "device":
      return DEVICE_ICONS[key] ?? Monitor
    case "browser":
    case "os":
      return null
  }
}

type BreakdownIconProps = { by: BreakdownBy; rowKey: string | null }

/** A flag, a category icon or a monogram. Decorative: the label is text. */
export function BreakdownIcon({ by, rowKey }: BreakdownIconProps) {
  if (by === "country") {
    const flag = countryFlag(rowKey)
    if (flag) {
      return (
        <span
          aria-hidden="true"
          className="w-4 shrink-0 text-center leading-none"
        >
          {flag}
        </span>
      )
    }
    return <Globe aria-hidden="true" className={ICON_CLASSES} />
  }

  const Icon = lucideIcon(by, rowKey ?? "")
  if (Icon) return <Icon aria-hidden="true" className={ICON_CLASSES} />

  // Browsers and operating systems: a neutral monogram.
  return (
    <span
      aria-hidden="true"
      className="grid size-4 shrink-0 place-items-center rounded-full bg-muted text-[0.625rem] font-semibold text-muted-foreground uppercase"
    >
      {rowKey?.[0] ?? "?"}
    </span>
  )
}
