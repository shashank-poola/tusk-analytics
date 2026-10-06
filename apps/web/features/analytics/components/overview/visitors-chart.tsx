"use client"

import type { StatsTimeseriesResponse } from "@workspace/contracts"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@workspace/ui/components/chart"
import { useId } from "react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"

import { Icon } from "@/components/ui/icon"

import { usePrefersReducedMotion } from "@/features/analytics/hooks/use-prefers-reduced-motion"
import { tickLabel } from "@/features/analytics/utils/chart-axis"
import { peakIndexes } from "@/features/analytics/utils/chart-peaks"
import { formatCompact } from "@/features/analytics/utils/format"
import { type ChartDatum, ChartTooltipBody } from "./chart-tooltip"

const chartConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
} satisfies ChartConfig

const ANIMATION_MS = 300
const PEAK_ICON_PX = 20

type VisitorsChartProps = {
  timeseries: StatsTimeseriesResponse
  /** Short name for the chart, e.g. "Visitors, last 7 days". */
  label: string
  /** The totals in words, for screen readers. */
  summary: string
}

type DotProps = { cx?: number; cy?: number; index?: number }

/**
 * Visitors only: one smooth line over a soft gradient, dashed for the
 * bucket still running. The biggest peaks carry the icon of the source
 * that brought most of their visitors; the tooltip adds pageviews and the
 * change versus the same bucket of the previous period.
 */
export function VisitorsChart({
  timeseries: { points, previousPoints, interval, inProgress },
  label,
  summary,
}: VisitorsChartProps) {
  // useId output can contain characters that break `url(#…)` references.
  const gradientId = `visitors-fill-${useId().replace(/[^\w-]/g, "")}`
  const reducedMotion = usePrefersReducedMotion()
  const scale = { interval, points: points.length }
  const animation = {
    isAnimationActive: !reducedMotion,
    animationDuration: ANIMATION_MS,
  }

  const last = points.length - 1
  const data = points.map((point, index) => ({
    ...point,
    previous: previousPoints[index]?.visitors ?? 0,
    previousT: previousPoints[index]?.t ?? point.t,
    // Two overlapping copies of the line: solid up to the last finished
    // bucket, dashed from there to the running one.
    finished: !inProgress || index < last ? point.visitors : undefined,
    running: inProgress && index >= last - 1 ? point.visitors : undefined,
  })) satisfies (ChartDatum & Record<string, unknown>)[]
  const peaks = new Set(
    peakIndexes(
      points.map((point) => point.visitors),
      (index) => Boolean(points[index]?.topSource)
    )
  )

  function renderPeak({ cx, cy, index }: DotProps) {
    const source = index === undefined ? null : points[index]?.topSource
    if (
      cx === undefined ||
      cy === undefined ||
      !source ||
      !peaks.has(index ?? -1)
    ) {
      return <g key={`peak-${index}`} />
    }
    return (
      <foreignObject
        key={`peak-${index}`}
        x={cx - PEAK_ICON_PX / 2}
        y={cy - PEAK_ICON_PX - 8}
        width={PEAK_ICON_PX}
        height={PEAK_ICON_PX}
        className="overflow-visible"
      >
        <span className="grid size-5 place-items-center rounded-md bg-surface shadow-card ring-1 ring-border">
          <Icon type="referrer" name={source} className="size-4" />
        </span>
      </foreignObject>
    )
  }

  return (
    <figure className="m-0">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-64 w-full sm:h-80"
        role="img"
        aria-label={label}
      >
        <ComposedChart data={data} margin={{ left: 4, right: 12, top: 32 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-visitors)"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="var(--color-visitors)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 6"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="t"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            minTickGap={28}
            tickFormatter={(t: string) => tickLabel(t, scale)}
          />
          <YAxis
            width={36}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickCount={5}
            domain={[0, (max: number) => Math.max(4, Math.ceil(max * 1.15))]}
            tickFormatter={formatCompact}
          />
          <ChartTooltip
            cursor={{
              stroke: "var(--color-visitors)",
              strokeOpacity: 0.4,
              strokeDasharray: "3 3",
            }}
            content={
              <ChartTooltipBody
                interval={interval}
                runningT={inProgress ? (points[last]?.t ?? null) : null}
              />
            }
          />
          <Area
            dataKey="visitors"
            type="monotone"
            stroke="none"
            fill={`url(#${gradientId})`}
            activeDot={{
              r: 5,
              strokeWidth: 3,
              stroke: "var(--surface)",
              fill: "var(--color-visitors)",
            }}
            {...animation}
          />
          <Line
            dataKey="finished"
            type="monotone"
            stroke="var(--color-visitors)"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={false}
            activeDot={false}
            tooltipType="none"
            {...animation}
          />
          <Line
            dataKey="running"
            type="monotone"
            stroke="var(--color-visitors)"
            strokeWidth={2.5}
            strokeDasharray="4 5"
            dot={false}
            activeDot={false}
            tooltipType="none"
            {...animation}
          />
          {/* Invisible line whose dots are the peak icons. */}
          <Line
            dataKey="visitors"
            stroke="none"
            dot={renderPeak}
            activeDot={false}
            tooltipType="none"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  )
}
