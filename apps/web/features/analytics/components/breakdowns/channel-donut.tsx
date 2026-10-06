"use client"

import {
  type ChartConfig,
  ChartContainer,
} from "@workspace/ui/components/chart"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Cell, Pie, PieChart } from "recharts"

import { Icon } from "@/components/ui/icon"

import { usePrefersReducedMotion } from "@/features/analytics/hooks/use-prefers-reduced-motion"
import { formatNumber } from "@/features/analytics/utils/format"

export type ChannelSlice = {
  /** "Organic search". */
  label: string
  visitors: number
  /** Up to three sources, for the icons on the slice. Untrusted text. */
  topSources: string[]
  /** Filters the dashboard by this channel. */
  href: string
}

type LabelProps = {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  index?: number
}

const RADIAN = Math.PI / 180
const ICON_PX = 16
const NO_CONFIG = {} satisfies ChartConfig

/** Steel blues from light to dark, biggest slice lightest, like DataFast. */
function sliceColor(index: number, count: number): string {
  const share = count <= 1 ? 80 : 80 - (index / (count - 1)) * 60
  return `color-mix(in oklab, var(--chart-1) ${Math.round(share)}%, var(--accent-soft))`
}

/**
 * The channel tab as a donut: each slice is a channel, with its top sources'
 * icons on it and its name on a leader line. A slice click filters by that
 * channel; the same links are in a visually hidden list for keyboards and
 * screen readers, so the drawing itself is decorative.
 */
export function ChannelDonut({ slices }: { slices: ChannelSlice[] }) {
  const router = useRouter()
  const reducedMotion = usePrefersReducedMotion()

  function renderLabel({
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    index = 0,
  }: LabelProps) {
    const slice = slices[index]
    if (!slice) return null
    const cos = Math.cos(-midAngle * RADIAN)
    const sin = Math.sin(-midAngle * RADIAN)
    const edge = { x: cx + outerRadius * cos, y: cy + outerRadius * sin }
    const bend = {
      x: cx + (outerRadius + 16) * cos,
      y: cy + (outerRadius + 16) * sin,
    }
    const end = { x: bend.x + (cos >= 0 ? 18 : -18), y: bend.y }
    const middle = (innerRadius + outerRadius) / 2
    const icons = slice.topSources.slice(0, 3)
    return (
      <g>
        <polyline
          points={`${edge.x},${edge.y} ${bend.x},${bend.y} ${end.x},${end.y}`}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeOpacity={0.6}
        />
        <text
          x={end.x + (cos >= 0 ? 4 : -4)}
          y={end.y}
          dominantBaseline="central"
          textAnchor={cos >= 0 ? "start" : "end"}
          className="fill-foreground text-xs"
        >
          {slice.label}
        </text>
        {icons.map((source, iconIndex) => (
          <foreignObject
            key={source}
            x={
              cx +
              middle * cos -
              (icons.length * ICON_PX) / 2 +
              iconIndex * ICON_PX
            }
            y={cy + middle * sin - ICON_PX / 2}
            width={ICON_PX}
            height={ICON_PX}
          >
            <Icon type="referrer" name={source} className="size-4" />
          </foreignObject>
        ))}
      </g>
    )
  }

  return (
    <>
      <ChartContainer
        config={NO_CONFIG}
        aria-hidden="true"
        className="aspect-auto h-full min-h-0 w-full flex-1"
      >
        <PieChart margin={{ top: 24, right: 96, bottom: 24, left: 96 }}>
          <Pie
            data={slices}
            dataKey="visitors"
            nameKey="label"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="var(--surface)"
            strokeWidth={2}
            label={renderLabel}
            labelLine={false}
            isAnimationActive={!reducedMotion}
            animationDuration={300}
            onClick={(_, index) => {
              const href = slices[index]?.href
              if (href) router.push(href, { scroll: false })
            }}
            className="cursor-pointer"
          >
            {slices.map((slice, index) => (
              <Cell key={slice.label} fill={sliceColor(index, slices.length)} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul
        aria-label="Channels"
        className="sr-only text-sm focus-within:not-sr-only focus-within:flex focus-within:flex-wrap focus-within:gap-3"
      >
        {slices.map((slice) => (
          <li key={slice.label}>
            <Link href={slice.href} scroll={false}>
              {slice.label}: {formatNumber(slice.visitors)} visitors
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
