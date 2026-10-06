import type { StatsBreakdownResponse } from "@workspace/contracts"
import Link from "next/link"

import { BreakdownIcon } from "./breakdown-icon"
import { BreakdownLabel } from "./breakdown-label"
import { formatCompact, formatNumber } from "@/features/analytics/utils/format"
import { keyLabel } from "@/features/analytics/utils/labels"

type Row = StatsBreakdownResponse["rows"][number]

type BreakdownRowsProps = {
  breakdown: StatsBreakdownResponse
  /** Accessible name of the list, e.g. "Top pages". */
  label: string
  /** The link that filters the dashboard by a row; null when it can't. */
  hrefFor: (row: Row) => string | null
}

const ROW_CLASSES =
  "group/row relative flex h-[2.125rem] items-center gap-2.5 rounded-md px-2.5 text-sm"

/**
 * One row per key: a blue bar sized against the top row behind the icon
 * and label, visitors on the right. Clicking a row filters the dashboard.
 * Pageviews are in the accessible text and the hover title. Keys are
 * tracker input, rendered as text.
 */
export function BreakdownRows({
  breakdown: { by, rows },
  label,
  hrefFor,
}: BreakdownRowsProps) {
  const maxVisitors = Math.max(1, ...rows.map((row) => row.visitors))
  return (
    <ul aria-label={label} className="space-y-1">
      {rows.map((row) => {
        const name = keyLabel(by, row.key)
        const href = hrefFor(row)
        const content = (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 origin-left animate-grow-x rounded-md bg-accent-soft transition-colors group-hover/row:bg-accent/30"
              style={{ width: `${(row.visitors / maxVisitors) * 100}%` }}
            />
            <span className="relative flex min-w-0 flex-1 items-center gap-2">
              <BreakdownIcon by={by} rowKey={row.key} country={row.country} />
              <BreakdownLabel by={by} rowKey={row.key} name={name} />
            </span>
            <span className="relative font-semibold tabular-nums">
              {formatCompact(row.visitors)}
            </span>
            <span className="sr-only">
              {formatNumber(row.visitors)} visitors,{" "}
              {formatNumber(row.pageviews)}{" "}
              {by === "exit_link" ? "clicks" : "pageviews"}
            </span>
          </>
        )
        return (
          <li key={`${row.country ?? ""}:${row.key ?? ""}`}>
            {href ? (
              <Link
                href={href}
                scroll={false}
                title={`Filter by ${name}`}
                className={ROW_CLASSES}
              >
                {content}
              </Link>
            ) : (
              <div className={ROW_CLASSES}>{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
