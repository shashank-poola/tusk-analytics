"use client"

import { cn } from "@workspace/ui/lib/utils"
import { useId, useState } from "react"

import { Card, FIXED_CARD_HEIGHT } from "@/components/ui/card"
import { TabList } from "@/components/ui/tab-list"

import { SortedByVisitors } from "@/features/analytics/components/breakdowns/breakdown-card"

type DemoBreakdownCardProps = {
  label: string
  tabs: { id: string; label: string }[]
  /** Each tab's rows, rendered on the server. */
  panels: Record<string, React.ReactNode>
  /** A feature row's card: its height comes from `className`. */
  compact?: boolean
  className?: string
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
  className,
}: DemoBreakdownCardProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? "")
  const id = useId()
  return (
    <Card
      aria-label={label}
      className={cn(
        "flex flex-col p-2.5",
        !compact && FIXED_CARD_HEIGHT,
        className
      )}
    >
      <div className="flex min-h-11 items-center justify-between gap-2 pr-1.5">
        <TabList
          label={`${label} breakdown`}
          tabs={tabs}
          active={active}
          onChange={setActive}
          idPrefix={id}
        />
        <SortedByVisitors />
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${active}`}
        tabIndex={0}
        className="mt-2 flex min-h-0 flex-1 flex-col rounded-xl"
      >
        {panels[active]}
      </div>
    </Card>
  )
}
