import type { BreakdownBy, StatsRange } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

import { routes } from "@/lib/routes"

const TABS: { label: string; by: BreakdownBy }[] = [
  { label: "Sources", by: "source" },
  { label: "Pages", by: "page" },
  { label: "Countries", by: "country" },
  { label: "Devices", by: "device" },
]

const DEVICE_TABS: { label: string; by: BreakdownBy }[] = [
  { label: "Device", by: "device" },
  { label: "Browser", by: "browser" },
  { label: "OS", by: "os" },
]

const isDeviceTab = (by: BreakdownBy) =>
  DEVICE_TABS.some((tab) => tab.by === by)

type BreakdownTabsProps = {
  siteId: string
  range: StatsRange
  active: BreakdownBy
}

/** Plain links: the active tab lives in `?tab=`. */
export function BreakdownTabs({ siteId, range, active }: BreakdownTabsProps) {
  const link = (tab: { label: string; by: BreakdownBy }, current: boolean) => (
    <Link
      key={tab.by}
      href={routes.site(siteId, { range, tab: tab.by })}
      scroll={false}
      aria-current={current ? "page" : undefined}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm transition-colors",
        current
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {tab.label}
    </Link>
  )

  return (
    <div className="space-y-2">
      <nav aria-label="Breakdown" className="flex flex-wrap gap-1">
        {TABS.map((tab) =>
          link(
            tab,
            tab.by === "device" ? isDeviceTab(active) : tab.by === active
          )
        )}
      </nav>
      {isDeviceTab(active) && (
        <nav aria-label="Device breakdown" className="flex flex-wrap gap-1">
          {DEVICE_TABS.map((tab) => link(tab, tab.by === active))}
        </nav>
      )}
    </div>
  )
}
