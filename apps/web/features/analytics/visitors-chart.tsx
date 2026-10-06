"use client"

import type { StatsTimeseriesResponse } from "@workspace/contracts"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { bucketLabel, formatCompact } from "./format"

const chartConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
  pageviews: { label: "Pageviews", color: "var(--chart-2)" },
} satisfies ChartConfig

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
  const data = points.map((point) => ({
    ...point,
    label: bucketLabel(point.t, interval),
  }))

  return (
    <figure>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-64 w-full"
        role="img"
        aria-label={label}
      >
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickFormatter={formatCompact}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            dataKey="pageviews"
            type="monotone"
            stroke="var(--color-pageviews)"
            fill="var(--color-pageviews)"
            fillOpacity={0.1}
          />
          <Area
            dataKey="visitors"
            type="monotone"
            stroke="var(--color-visitors)"
            fill="var(--color-visitors)"
            fillOpacity={0.1}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  )
}
