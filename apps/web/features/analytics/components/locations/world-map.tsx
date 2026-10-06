import type { StatsBreakdownResponse } from "@workspace/contracts"

import { formatNumber } from "@/features/analytics/utils/format"
import { countryLabel } from "@/features/analytics/utils/labels"
import { MapInteraction } from "./map-interaction"
import { COUNTRY_PATHS, WORLD_MAP_VIEWBOX } from "./world-map-paths"

type Row = StatsBreakdownResponse["rows"][number]

type WorldMapProps = {
  /** The country breakdown, every country with visitors. */
  rows: Row[]
  /** The link that filters the dashboard by a country. */
  hrefFor: (row: Row) => string | null
}

/** Hairline borders; the country under the pointer lifts and gets an outline. */
const COUNTRY_CLASSES =
  "stroke-border stroke-[0.6] transition-[filter] duration-150 hover:stroke-foreground/70 hover:brightness-125"

const UNVISITED = "color-mix(in oklab, var(--accent-soft) 75%, var(--surface))"

/** Brighter with more visitors; square root so small countries still show. */
function visitedFill(visitors: number, max: number): string {
  const share = Math.round(25 + 75 * Math.sqrt(visitors / max))
  return `color-mix(in oklab, var(--chart-1) ${share}%, var(--accent-soft))`
}

/**
 * Countries with visitors light up, the busiest brightest; hovering any
 * country shows its visitors, clicking a visited one filters by it. Static
 * paths drawn on the server: no map library, no client-side geometry.
 */
export function WorldMap({ rows, hrefFor }: WorldMapProps) {
  const visited = new Map(
    rows.flatMap((row) => (row.key ? [[row.key, row] as const] : []))
  )
  const max = Math.max(1, ...rows.map((row) => row.visitors))
  return (
    <MapInteraction>
      <svg
        viewBox={WORLD_MAP_VIEWBOX}
        role="group"
        aria-label="Visitors by country"
        className="h-full w-full"
      >
        {Object.entries(COUNTRY_PATHS).map(([code, d]) => {
          const row = visited.get(code)
          const href = row && hrefFor(row)
          const name = countryLabel(code)
          const visitors = row?.visitors ?? 0
          const path = (
            <path
              key={code}
              d={d}
              fill={row ? visitedFill(visitors, max) : UNVISITED}
              data-country={name}
              data-visitors={visitors}
              className={
                href ? `${COUNTRY_CLASSES} cursor-pointer` : COUNTRY_CLASSES
              }
              aria-hidden={href ? undefined : true}
            />
          )
          if (!href) return path
          const label = `${name}: ${formatNumber(visitors)} ${visitors === 1 ? "visitor" : "visitors"}`
          return (
            <a key={code} href={href} aria-label={label}>
              {path}
            </a>
          )
        })}
      </svg>
    </MapInteraction>
  )
}
