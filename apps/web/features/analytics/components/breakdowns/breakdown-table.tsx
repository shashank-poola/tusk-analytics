import type { StatsBreakdownResponse } from "@workspace/contracts"

import { ViewLink } from "@/features/analytics/components/view-link"
import { BreakdownIcon } from "./breakdown-icon"
import { BreakdownLabel } from "./breakdown-label"
import { formatNumber } from "@/features/analytics/utils/format"
import { keyLabel } from "@/features/analytics/utils/labels"

type Row = StatsBreakdownResponse["rows"][number]

type BreakdownTableProps = {
  breakdown: StatsBreakdownResponse
  /** The column heading, e.g. "Referrer". */
  title: string
  /** The link that filters the dashboard by a row; null when it can't. */
  hrefFor: (row: Row) => string | null
}

/**
 * Every row of a breakdown as DataFast's Details list: a plain table, the
 * name with its icon and the visitors, no bars. A row filters the
 * dashboard on click (the name's link covers the row). `data-search`
 * feeds the dialog's search box. Keys are tracker input, rendered as text.
 */
export function BreakdownTable({
  breakdown: { by, rows },
  title,
  hrefFor,
}: BreakdownTableProps) {
  return (
    <table className="w-full text-[0.9375rem]">
      <thead className="sticky top-0 z-10 bg-surface text-left text-xs font-semibold text-muted-foreground">
        <tr className="border-b border-border">
          <th scope="col" className="px-4 py-3 font-semibold">
            {title}
          </th>
          <th scope="col" className="w-36 px-4 py-3 text-center font-semibold">
            Visitors
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const name = keyLabel(by, row.key)
          const href = hrefFor(row)
          const label = (
            <span className="flex min-w-0 items-center gap-2.5">
              <BreakdownIcon by={by} rowKey={row.key} country={row.country} />
              <BreakdownLabel by={by} rowKey={row.key} name={name} />
            </span>
          )
          return (
            <tr
              key={`${row.country ?? ""}:${row.key ?? ""}`}
              data-search={name.toLowerCase()}
              className="relative transition-colors odd:bg-muted/25 hover:bg-muted/60"
            >
              <td className="max-w-0 px-4 py-3.5">
                {href ? (
                  <ViewLink
                    href={href}
                    scroll={false}
                    title={`Filter by ${name}`}
                    className="block outline-none after:absolute after:inset-0 focus-visible:underline"
                  >
                    {label}
                  </ViewLink>
                ) : (
                  label
                )}
              </td>
              <td className="px-4 py-3.5 text-center font-medium tabular-nums">
                {formatNumber(row.visitors)}
                <span className="sr-only">
                  {" "}
                  visitors, {formatNumber(row.pageviews)}{" "}
                  {by === "exit_link" ? "clicks" : "pageviews"}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
