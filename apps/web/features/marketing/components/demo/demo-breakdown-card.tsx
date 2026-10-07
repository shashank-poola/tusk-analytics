"use client"

import { cn } from "@workspace/ui/lib/utils"
import { useId, useState } from "react"

import { Card, FIXED_CARD_HEIGHT } from "@/components/ui/card"

import { SortedByVisitors } from "@/features/analytics/components/breakdowns/breakdown-card"
import {
  TAB_TRACK_CLASSES,
  tabClasses,
} from "@/features/analytics/components/tab-pills"

type DemoBreakdownCardProps = {
  label: string
  tabs: { id: string; label: string }[]
  /** Each tab's rows, rendered on the server. */
  panels: Record<string, React.ReactNode>
  /** Sizes to its rows instead of the dashboard's fixed height. */
  compact?: boolean
}

/**
 * The dashboard's breakdown card with tabs that switch in place: the real
 * one keeps its tab in the URL, which a demo on the landing page can't.
 */
export function DemoBreakdownCard({
  label,
  tabs,
  panels,
  compact = false,
}: DemoBreakdownCardProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? "")
  const id = useId()
  return (
    <Card
      aria-label={label}
      className={cn("flex flex-col p-2.5", !compact && FIXED_CARD_HEIGHT)}
    >
      <div className="flex min-h-11 items-center justify-between gap-2 pr-1.5">
        <div className="min-w-0 overflow-x-auto">
          <div
            role="tablist"
            aria-label={`${label} breakdown`}
            className={TAB_TRACK_CLASSES}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${id}-${tab.id}`}
                aria-selected={tab.id === active}
                aria-controls={`${id}-panel`}
                onClick={() => setActive(tab.id)}
                className={tabClasses(tab.id === active)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <SortedByVisitors />
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${active}`}
        className="mt-2 flex min-h-0 flex-1 flex-col"
      >
        {panels[active]}
      </div>
    </Card>
  )
}
