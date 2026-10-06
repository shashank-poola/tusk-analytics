import type { StatsBreakdownResponse } from "@workspace/contracts"

import { BreakdownIcon } from "./breakdown-icon"
import { formatCompact, formatNumber } from "@/features/analytics/utils/format"
import { keyLabel } from "@/features/analytics/utils/labels"

type BreakdownRowsProps = {
  breakdown: StatsBreakdownResponse
  /** Accessible name of the list, e.g. "Top sources". */
  label: string
}

/**
 * One row per key: a bar sized against the top row grows in behind the icon
 * and label, with visitors on the right. Pageviews show on hover and are
 * always in the accessible text. Keys are tracker input, rendered as text.
 */
export function BreakdownRows({
  breakdown: { by, rows },
  label,
}: BreakdownRowsProps) {
  const maxVisitors = Math.max(1, ...rows.map((row) => row.visitors))
  return (
    <ul aria-label={label} className="space-y-1">
      {rows.map((row) => {
        const name = keyLabel(by, row.key)
        return (
          <li
            key={`${row.country ?? ""}:${row.key ?? ""}`}
            className="group/row relative flex h-9 items-center gap-2.5 px-3 text-sm"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 origin-left animate-grow-x rounded-lg bg-accent-soft transition-colors group-hover/row:bg-accent/25"
              style={{ width: `${(row.visitors / maxVisitors) * 100}%` }}
            />
            <span className="relative flex min-w-0 flex-1 items-center gap-2">
              <BreakdownIcon by={by} rowKey={row.key} country={row.country} />
              <span className="truncate" title={name}>
                {name}
              </span>
            </span>
            <span className="relative text-xs text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100">
              <span aria-hidden="true">
                {formatCompact(row.pageviews)} views
              </span>
            </span>
            <span className="relative w-12 text-right font-semibold tabular-nums">
              {formatCompact(row.visitors)}
            </span>
            <span className="sr-only">
              {formatNumber(row.visitors)} visitors,{" "}
              {formatNumber(row.pageviews)} pageviews
            </span>
          </li>
        )
      })}
    </ul>
  )
}
