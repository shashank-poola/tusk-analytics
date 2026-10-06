import type { StatsBreakdownResponse } from "@workspace/contracts"

import { formatNumber } from "@/features/analytics/utils/format"
import { countryLabel } from "@/features/analytics/utils/labels"
import { SvgLinkRouter } from "./svg-link-router"
import { COUNTRY_PATHS, WORLD_MAP_VIEWBOX } from "./world-map-paths"

type Row = StatsBreakdownResponse["rows"][number]

type WorldMapProps = {
  /** The country breakdown, every country with visitors. */
  rows: Row[]
  /** The link that filters the dashboard by a country. */
  hrefFor: (row: Row) => string | null
}

const UNVISITED = "color-mix(in oklab, var(--accent-soft) 75%, var(--surface))"

/** Brighter with more visitors; square root so small countries still show. */
function visitedFill(visitors: number, max: number): string {
  const share = Math.round(25 + 75 * Math.sqrt(visitors / max))
  return `color-mix(in oklab, var(--chart-1) ${share}%, var(--accent-soft))`
}

/**
 * Countries with visitors light up, the busiest brightest; each is a link
 * that filters by it, with its count on hover. Static paths drawn on the
 * server: no map library and no client-side geometry.
 */
export function WorldMap({ rows, hrefFor }: WorldMapProps) {
  const visited = new Map(
    rows.flatMap((row) => (row.key ? [[row.key, row] as const] : []))
  )
  const max = Math.max(1, ...rows.map((row) => row.visitors))
  return (
    <SvgLinkRouter>
      <svg
        viewBox={WORLD_MAP_VIEWBOX}
        role="group"
        aria-label="Visitors by country"
        className="h-full w-full"
      >
        {Object.entries(COUNTRY_PATHS).map(([code, d]) => {
          const row = visited.get(code)
          const href = row && hrefFor(row)
          if (!row || !href) {
            return (
              <path
                key={code}
                d={d}
                fill={UNVISITED}
                stroke="var(--border)"
                strokeWidth={0.5}
                aria-hidden="true"
              />
            )
          }
          const label = `${countryLabel(code)}: ${formatNumber(row.visitors)} ${row.visitors === 1 ? "visitor" : "visitors"}`
          return (
            <a key={code} href={href} aria-label={label}>
              <path
                d={d}
                fill={visitedFill(row.visitors, max)}
                stroke="var(--border)"
                strokeWidth={0.5}
                className="transition-opacity hover:opacity-80"
              >
                <title>{label}</title>
              </path>
            </a>
          )
        })}
      </svg>
    </SvgLinkRouter>
  )
}
