import type { BreakdownBy, StatsBreakdownResponse } from "@workspace/contracts"

import { countryName, formatCompact } from "./format"
import { NoVisits } from "./no-visits"

const COLUMN_LABELS: Record<BreakdownBy, string> = {
  source: "Source",
  page: "Page",
  country: "Country",
  device: "Device",
  browser: "Browser",
  os: "OS",
}

type BreakdownTableProps = { breakdown: StatsBreakdownResponse }

/**
 * Keys come from tracker input: they are rendered as text only (React
 * escapes them), never as links or HTML.
 */
export function BreakdownTable({
  breakdown: { by, rows },
}: BreakdownTableProps) {
  if (rows.length === 0) return <NoVisits />

  const maxVisitors = Math.max(...rows.map((row) => row.visitors))
  const showPageviews = by === "page"
  const keyLabel = (key: string | null) =>
    by === "country" ? countryName(key) : (key ?? "Unknown")

  return (
    <table className="w-full table-fixed text-sm">
      <caption className="sr-only">Top {COLUMN_LABELS[by]} by visitors</caption>
      <thead>
        <tr className="text-left text-muted-foreground">
          <th scope="col" className="py-2 font-normal">
            {COLUMN_LABELS[by]}
          </th>
          <th scope="col" className="w-24 py-2 text-right font-normal">
            Visitors
          </th>
          {showPageviews && (
            <th scope="col" className="w-24 py-2 text-right font-normal">
              Pageviews
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const label = keyLabel(row.key)
          return (
            <tr key={row.key ?? ""}>
              <td className="relative py-1">
                <div
                  aria-hidden
                  className="absolute inset-y-1 left-0 rounded-md bg-muted"
                  style={{ width: `${(row.visitors / maxVisitors) * 100}%` }}
                />
                <span className="relative block truncate px-2" title={label}>
                  {label}
                </span>
              </td>
              <td className="py-1 text-right tabular-nums">
                {formatCompact(row.visitors)}
              </td>
              {showPageviews && (
                <td className="py-1 text-right tabular-nums">
                  {formatCompact(row.pageviews)}
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
