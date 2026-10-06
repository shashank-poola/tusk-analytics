import type { StatsRange } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

import { routes } from "@/lib/routes"

import type { DeviceTab } from "./analytics-params"

const TABS: { label: string; tab: DeviceTab }[] = [
  { label: "Device", tab: "device" },
  { label: "Browser", tab: "browser" },
  { label: "OS", tab: "os" },
]

type DeviceTabsProps = { siteId: string; range: StatsRange; active: DeviceTab }

/** Plain links: the sub-tab lives in `?tab=`, so it survives a reload. */
export function DeviceTabs({ siteId, range, active }: DeviceTabsProps) {
  return (
    <nav aria-label="Devices breakdown" className="-mx-1 overflow-x-auto px-1">
      <ul className="inline-flex gap-1 rounded-full bg-muted p-0.5">
        {TABS.map(({ label, tab }) => (
          <li key={tab}>
            <Link
              href={routes.site(siteId, { range, tab })}
              scroll={false}
              aria-current={tab === active ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center rounded-full px-3 text-xs font-medium transition-colors sm:h-7",
                tab === active
                  ? "bg-surface text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
