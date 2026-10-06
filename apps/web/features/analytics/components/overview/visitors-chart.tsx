"use client"

import type { StatsTimeseriesResponse } from "@workspace/contracts"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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

import { usePrefersReducedMotion } from "@/features/analytics/hooks/use-prefers-reduced-motion"

import { tickLabel, tooltipLabel } from "@/features/analytics/utils/chart-axis"
import { formatCompact } from "@/features/analytics/utils/format"

const chartConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
  pageviews: { label: "Pageviews", color: "var(--chart-2)" },
} satisfies ChartConfig

const ANIMATION_MS = 300

type VisitorsChartProps = {
  timeseries: StatsTimeseriesResponse
  /** Short name for the chart, e.g. "Visitors and pageviews, last 7 days". */
  label: string
  /** The totals in words, for screen readers. */
  summary: string
}

/**
 * Visitors as a line over a soft fill, pageviews as bars on their own
 * scale behind it. The last bucket is still running (ranges end now), so
 * its stretch of the line is dashed.
 */
export function VisitorsChart({
  timeseries: { points, interval },
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
    // Two overlapping copies of the line: solid up to the last finished
    // bucket, dashed from there to the running one.
    finished: index < last ? point.visitors : undefined,
    running: index >= last - 1 ? point.visitors : undefined,
  }))
  const maxPageviews = Math.max(1, ...points.map((point) => point.pageviews))

  return (
    <figure className="m-0">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-64 w-full sm:h-80"
        role="img"
        aria-label={label}
      >
        <ComposedChart data={data} margin={{ left: 4, right: 4, top: 12 }}>
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
              <ChartTooltipContent
                indicator="dot"
                labelFormatter={(_, payload) => {
                  const t: unknown = payload[0]?.payload?.t
                  return typeof t === "string" ? tooltipLabel(t, interval) : ""
                }}
              />
            }
          />
          <Bar
            yAxisId="pageviews"
            dataKey="pageviews"
            fill="var(--color-pageviews)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
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
        </ComposedChart>
      </ChartContainer>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  )
}
