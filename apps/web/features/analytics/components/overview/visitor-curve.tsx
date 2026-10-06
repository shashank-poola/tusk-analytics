"use client"

import { useId } from "react"
import { Curve, usePlotArea, useXAxisScale, useYAxisScale } from "recharts"

type VisitorCurveProps = {
  /** One entry per bucket, as the chart's data: its x value and visitors. */
  points: { t: string; visitors: number }[]
  /**
   * Index of the point where the dashed stretch starts: the last finished
   * bucket, so the running bucket is reached by a dashed curve. Null when
   * the period is over and the whole curve is solid.
   */
  dashedFrom: number | null
}

/** Room around the plot for the glow and the line's round ends. */
const BLEED_PX = 24

/**
 * The visitors line as one continuous smooth curve through every point,
 * solid up to `dashedFrom` and dashed after it. Two clipped copies of the
 * same path, rather than two short series, so the dashed part keeps the
 * curve's shape (a segment drawn alone has no neighbours to bend towards).
 * Drawn inside the chart, so it uses the chart's own scales.
 */
export function VisitorCurve({ points, dashedFrom }: VisitorCurveProps) {
  const id = useId().replace(/[^\w-]/g, "")
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()
  const plot = usePlotArea()
  if (!xScale || !yScale || !plot || points.length === 0) return null

  const coordinates = points.flatMap(({ t, visitors }) => {
    const x = xScale(t, { position: "middle" })
    const y = yScale(visitors)
    return x === undefined || y === undefined ? [] : [{ x, y }]
  })
  if (coordinates.length < 2) return null

  const split =
    dashedFrom === null
      ? plot.x + plot.width + BLEED_PX
      : (coordinates[dashedFrom]?.x ?? plot.x + plot.width)
  const top = plot.y - BLEED_PX
  const height = plot.height + BLEED_PX * 2
  const curve = {
    points: coordinates,
    type: "monotone",
    fill: "none",
    stroke: "var(--color-visitors)",
    strokeWidth: 2.5,
    strokeLinecap: "round",
  } as const

  return (
    <g aria-hidden="true" pointerEvents="none">
      <defs>
        <clipPath id={`solid-${id}`}>
          <rect
            x={plot.x - BLEED_PX}
            y={top}
            width={split - plot.x + BLEED_PX}
            height={height}
          />
        </clipPath>
        <clipPath id={`dashed-${id}`}>
          <rect
            x={split}
            y={top}
            width={plot.x + plot.width + BLEED_PX - split}
            height={height}
          />
        </clipPath>
      </defs>
      <g
        clipPath={`url(#solid-${id})`}
        className="[filter:drop-shadow(0_6px_10px_color-mix(in_oklab,var(--chart-1)_35%,transparent))]"
      >
        <Curve {...curve} />
      </g>
      {dashedFrom !== null && (
        <g clipPath={`url(#dashed-${id})`}>
          <Curve {...curve} strokeDasharray="4 5" />
        </g>
      )}
    </g>
  )
}
