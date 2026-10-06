import type { FunnelStep } from "@workspace/contracts"
import { ArrowRight, FileText, Target } from "lucide-react"

import {
  formatCompact,
  formatNumber,
  LOCALE,
} from "@/features/analytics/utils/format"

type FunnelChartProps = {
  steps: (FunnelStep & { visitors: number })[]
  /** "Last 30 days". */
  periodLabel: string
}

const percent = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  maximumFractionDigits: 1,
})

/** Darkest first, lightest last, like DataFast's flow. */
function stepFill(index: number, count: number): string {
  const share = count <= 1 ? 50 : 20 + (index / (count - 1)) * 70
  return `color-mix(in oklab, var(--chart-1) ${Math.round(share)}%, var(--accent-soft))`
}

/** Half the band's height at a step, in a 0–100 tall viewBox. */
function halfHeight(visitors: number, max: number): number {
  return Math.max(1, (visitors / max) * 45)
}

/**
 * DataFast's funnel flow: one column per step, the band narrowing into the
 * next step, the drop between steps on the boundary, and visitors per step
 * below. A static SVG: no chart library, no client JavaScript.
 */
export function FunnelChart({ steps, periodLabel }: FunnelChartProps) {
  const count = steps.length
  const max = Math.max(1, ...steps.map((step) => step.visitors))
  const first = steps[0]?.visitors ?? 0
  const last = steps.at(-1)?.visitors ?? 0
  const conversion = first === 0 ? 0 : last / first

  return (
    <figure className="relative m-0 flex min-h-0 flex-1 flex-col">
      <figcaption className="absolute top-0 right-2 z-10 text-right">
        <span className="block text-sm font-semibold">
          {percent.format(conversion)} conversion rate
        </span>
        <span className="block text-xs text-muted-foreground">
          {periodLabel}
        </span>
      </figcaption>
      <div className="relative min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${count * 100} 100`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          {steps.map((step, index) => {
            const x0 = index * 100
            const x1 = x0 + 100
            const left = halfHeight(step.visitors, max)
            const right = halfHeight(
              steps[index + 1]?.visitors ?? step.visitors,
              max
            )
            return (
              <g key={`${step.type}:${step.value}:${index}`}>
                <path
                  d={`M${x0},${50 - left} C${x0 + 60},${50 - left} ${x1 - 40},${50 - right} ${x1},${50 - right} L${x1},${50 + right} C${x1 - 40},${50 + right} ${x0 + 60},${50 + left} ${x0},${50 + left} Z`}
                  fill={stepFill(index, count)}
                />
                {index > 0 && (
                  <line
                    x1={x0}
                    x2={x0}
                    y1={0}
                    y2={100}
                    stroke="var(--border)"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </g>
            )
          })}
        </svg>
        {steps.slice(1).map((step, index) => {
          const before = steps[index]?.visitors ?? 0
          const drop = before === 0 ? 0 : (step.visitors - before) / before
          return (
            <span
              key={`drop-${index}`}
              className="absolute top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-md bg-surface/80 px-1.5 py-0.5 text-[0.6875rem] font-medium tabular-nums backdrop-blur"
              style={{ left: `${((index + 1) / count) * 100}%` }}
            >
              {percent.format(drop)}
              <ArrowRight aria-hidden="true" className="size-3" />
            </span>
          )
        })}
      </div>
      <ol
        className="grid pt-2"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => {
          const StepIcon = step.type === "page" ? FileText : Target
          return (
            <li
              key={`${step.type}:${step.value}:${index}`}
              className="min-w-0 px-2"
            >
              <p className="text-sm font-semibold tabular-nums">
                {formatCompact(step.visitors)} visitors
                <span className="sr-only">
                  {" "}
                  ({formatNumber(step.visitors)})
                </span>
              </p>
              <p
                className="flex items-center gap-1 text-xs text-muted-foreground"
                title={step.value}
              >
                <StepIcon aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="truncate">
                  {step.type === "page" ? `Visit ${step.value}` : step.value}
                </span>
              </p>
            </li>
          )
        })}
      </ol>
    </figure>
  )
}
