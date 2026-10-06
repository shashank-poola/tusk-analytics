import type { StatsBreakdownResponse } from "@workspace/contracts"

import { NoData } from "@/features/analytics/components/empty-state"
import { BreakdownDialog } from "./breakdown-dialog"
import { BreakdownRows } from "./breakdown-rows"

/** Rows in the card; "Details" lists every row the request returned. */
export const TOP_ROWS = 10

type Row = StatsBreakdownResponse["rows"][number]

type BreakdownBodyProps = {
  title: string
  breakdown: StatsBreakdownResponse
  /** The link that filters the dashboard by a row; null when it can't. */
  hrefFor: (row: Row) => string | null
}

/** The top ten rows, and "Details" at the bottom for the full list. */
export function BreakdownBody({
  title,
  breakdown,
  hrefFor,
}: BreakdownBodyProps) {
  const { rows } = breakdown
  if (rows.length === 0) return <NoData />
  return (
    <>
      <BreakdownRows
        label={`Top ${title.toLowerCase()}`}
        breakdown={{ ...breakdown, rows: rows.slice(0, TOP_ROWS) }}
        hrefFor={hrefFor}
      />
      <div className="mt-auto flex justify-center pt-1">
        <BreakdownDialog title={title} count={rows.length}>
          <BreakdownRows
            label={`All ${title.toLowerCase()}`}
            breakdown={breakdown}
            hrefFor={hrefFor}
          />
        </BreakdownDialog>
      </div>
    </>
  )
}
