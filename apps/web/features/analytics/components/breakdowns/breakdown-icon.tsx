import {
  type BreakdownBy,
  type Channel,
  channelSchema,
} from "@workspace/contracts"
import {
  BadgeDollarSign,
  Link,
  type LucideIcon,
  Mail,
  Megaphone,
  MessagesSquare,
  MousePointerClick,
  Search,
  Sparkles,
} from "lucide-react"

import { Icon } from "@/components/ui/icon"

const CHANNEL_ICONS: Record<Channel, LucideIcon> = {
  direct: MousePointerClick,
  search: Search,
  social: MessagesSquare,
  ai: Sparkles,
  email: Mail,
  paid: BadgeDollarSign,
  referral: Link,
}

const ICON_CLASSES = "size-4 shrink-0 text-muted-foreground"

type BreakdownIconProps = {
  by: BreakdownBy
  rowKey: string | null
  /** Region and city rows: the country they are in. */
  country?: string | null
}

/** A logo, flag or category icon. Decorative: the label is text. */
export function BreakdownIcon({ by, rowKey, country }: BreakdownIconProps) {
  switch (by) {
    case "source":
    case "referrer":
      if (!rowKey || rowKey === "direct") {
        return <MousePointerClick aria-hidden="true" className={ICON_CLASSES} />
      }
      return <Icon type="referrer" name={rowKey} />
    case "browser":
    case "os":
    case "device":
    case "country":
      return <Icon type={by} name={rowKey} />
    case "region":
    case "city":
      return <Icon type="country" name={country} />
    case "channel": {
      const channel = channelSchema.safeParse(rowKey)
      const ChannelIcon = channel.success ? CHANNEL_ICONS[channel.data] : Link
      return <ChannelIcon aria-hidden="true" className={ICON_CLASSES} />
    }
    case "campaign":
      return <Megaphone aria-hidden="true" className={ICON_CLASSES} />
    case "page":
    case "entry_page":
    case "exit_page":
      return null
  }
}
