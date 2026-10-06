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
  Bar,
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
  pageviews: { label: "Pageviews", color: "var(--chart-2)" },
} satisfies ChartConfig

const ANIMATION_MS = 300
const PEAK_ICON_PX = 20

type VisitorsChartProps = {
  timeseries: StatsTimeseriesResponse
  /** Short name for the chart, e.g. "Visitors and pageviews, last 7 days". */
  label: string
  /** The totals in words, for screen readers. */
  summary: string
}

type BarShapeProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
}

type DotProps = { cx?: number; cy?: number; index?: number }

/**
 * Visitors as a smooth line over a soft fill, the previous period as a
 * faint line behind it, pageviews as bars on their own scale. A running
 * last bucket is dashed (line and bar). The biggest peaks carry the icon of
 * the source that brought most of their visitors.
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
  const maxPageviews = Math.max(1, ...points.map((point) => point.pageviews))
  const peaks = new Set(
    peakIndexes(
      points.map((point) => point.visitors),
      (index) => Boolean(points[index]?.topSource)
    )
  )

  function renderBar({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    index,
  }: BarShapeProps) {
    if (height <= 0) return <g />
    const running = inProgress && index === last
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill="var(--color-pageviews)"
        fillOpacity={running ? 0.35 : 1}
        stroke={running ? "var(--color-visitors)" : "none"}
        strokeOpacity={0.6}
        strokeDasharray={running ? "3 3" : undefined}
      />
    )
  }

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
        y={cy - PEAK_ICON_PX - 6}
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
        <ComposedChart data={data} margin={{ left: 4, right: 4, top: 28 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-visitors)"
                stopOpacity={0.22}
              />
              <stop
                offset="100%"
                stopColor="var(--color-visitors)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis
            dataKey="t"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={28}
            tickFormatter={(t: string) => tickLabel(t, scale)}
          />
          <YAxis
            yAxisId="visitors"
            width={36}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickFormatter={formatCompact}
          />
          {/* Bars top out at ~60% of the height so the line stays readable. */}
          <YAxis
            yAxisId="pageviews"
            orientation="right"
            hide
            domain={[0, Math.ceil(maxPageviews * 1.6)]}
          />
          <ChartTooltip
            cursor={{ fill: "var(--color-border)", opacity: 0.35 }}
            content={
              <ChartTooltipBody
                interval={interval}
                runningT={inProgress ? (points[last]?.t ?? null) : null}
              />
            }
          />
          <Bar
            yAxisId="pageviews"
            dataKey="pageviews"
            shape={renderBar}
            maxBarSize={28}
            {...animation}
          />
          <Line
            yAxisId="visitors"
            dataKey="previous"
            type="monotone"
            stroke="var(--color-visitors)"
            strokeOpacity={0.3}
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
            tooltipType="none"
            {...animation}
          />
          <Area
            yAxisId="visitors"
            dataKey="visitors"
            type="monotone"
            stroke="none"
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
            {...animation}
          />
          <Line
            yAxisId="visitors"
            dataKey="finished"
            type="monotone"
            stroke="var(--color-visitors)"
            strokeWidth={2.5}
            dot={false}
            activeDot={false}
            tooltipType="none"
            {...animation}
          />
          <Line
            yAxisId="visitors"
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
            yAxisId="visitors"
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
