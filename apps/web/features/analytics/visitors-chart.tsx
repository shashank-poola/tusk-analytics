"use client"

import type { StatsTimeseriesResponse } from "@workspace/contracts"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import { useId } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

import { tickLabel, tooltipLabel } from "./chart-axis"
import { formatCompact } from "./format"

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

  return (
    <figure className="m-0">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-56 w-full sm:h-72"
        role="img"
        aria-label={label}
      >
        <AreaChart data={points} margin={{ left: 4, right: 12, top: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-visitors)"
                stopOpacity={0.28}
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
            tickMargin={8}
            minTickGap={28}
            tickFormatter={(t: string) => tickLabel(t, scale)}
          />
          <YAxis
            width={36}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickFormatter={formatCompact}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--color-border)", strokeWidth: 1.5 }}
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
          <Area
            dataKey="pageviews"
            type="monotone"
            stroke="var(--color-pageviews)"
            strokeWidth={1.5}
            fill="transparent"
            {...animation}
          />
          <Area
            dataKey="visitors"
            type="monotone"
            stroke="var(--color-visitors)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
            {...animation}
          />
        </AreaChart>
      </ChartContainer>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  )
}
