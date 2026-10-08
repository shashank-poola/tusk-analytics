"use client"

import type { StatsGoalsResponse } from "@workspace/contracts"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { tickLabel, tooltipLabel } from "@/features/analytics/utils/chart-axis"
import { formatCompact } from "@/features/analytics/utils/format"
import { goalColor } from "./goal-colors"

type GoalsChartProps = { goals: StatsGoalsResponse }

/** One smooth line per charted goal: visitors who completed it per bucket. */
export function GoalsChart({
  goals: { buckets, goals, interval },
}: GoalsChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const charted = goals.filter((goal) => goal.series.length > 0)
  // Keys by position: goal names are tracker input, not safe CSS idents.
  const config = Object.fromEntries(
    charted.map((goal, index) => [
      `g${index}`,
      { label: goal.name, color: goalColor(index) },
    ])
  ) satisfies ChartConfig
  const data = buckets.map((t, bucket) => ({
    t,
    ...Object.fromEntries(
      charted.map((goal, index) => [`g${index}`, goal.series[bucket] ?? 0])
    ),
  }))
  const scale = { interval, points: buckets.length }

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-full min-h-48 w-full"
      role="img"
      aria-label="Visitors who completed each goal over time"
    >
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
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
          width={36}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={formatCompact}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_, payload) => {
                const t: unknown = payload[0]?.payload?.t
                return typeof t === "string" ? tooltipLabel(t, interval) : ""
              }}
            />
          }
        />
        {charted.map((goal, index) => (
          <Line
            key={goal.name}
            dataKey={`g${index}`}
            type="monotone"
            stroke={`var(--color-g${index})`}
            strokeWidth={2}
            dot={false}
            isAnimationActive={!reducedMotion}
            animationDuration={300}
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}
