import type { StatsBreakdownResponse, StatsRange } from "@workspace/contracts"

import { Card } from "@/components/dashboard/card"

import { BreakdownDialog } from "./breakdown-dialog"
import { BreakdownRows } from "./breakdown-rows"
import { EmptyState } from "./empty-state"

const TOP_ROWS = 5

type BreakdownCardProps = {
  title: string
  /** Sub-tabs next to the title (Devices). */
  tabs?: React.ReactNode
  children: React.ReactNode
}

/** The frame stays put while its rows load, fail or change tab. */
export function BreakdownCard({ title, tabs, children }: BreakdownCardProps) {
  const headingId = `breakdown-${title.toLowerCase()}`
  return (
    <Card aria-labelledby={headingId} className="flex flex-col p-4 sm:p-5">
      <div className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="font-medium">
          {title}
        </h2>
        {tabs}
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  )
}

type BreakdownBodyProps = {
  title: string
  siteId: string
  range: StatsRange
  breakdown: StatsBreakdownResponse
}

/** Top 5 rows, with "View all" for up to 50 when there are more. */
export function BreakdownBody({
  title,
  siteId,
  range,
  breakdown,
}: BreakdownBodyProps) {
  const { rows } = breakdown
  if (rows.length === 0) {
    return <EmptyState siteId={siteId} range={range} compact />
  }
  return (
    <>
      <BreakdownRows
        label={`Top ${title.toLowerCase()}`}
        breakdown={{ ...breakdown, rows: rows.slice(0, TOP_ROWS) }}
      />
      {rows.length > TOP_ROWS && (
        <div className="mt-2 flex justify-end">
          <BreakdownDialog title={title} count={rows.length}>
            <BreakdownRows
              label={`All ${title.toLowerCase()}`}
              breakdown={breakdown}
            />
          </BreakdownDialog>
        </div>
      )}
    </>
  )
}
