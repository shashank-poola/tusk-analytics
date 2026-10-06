"use client"

import type { StatsInterval } from "@workspace/contracts"

import { Icon } from "@/components/ui/icon"

import { ChangeIndicator } from "./change-indicator"
import { tooltipLabel } from "@/features/analytics/utils/chart-axis"
import { countChange, formatNumber } from "@/features/analytics/utils/format"
import { sourceLabel } from "@/features/analytics/utils/labels"

/** One bucket of the chart, as the tooltip reads it. */
export type ChartDatum = {
  t: string
  visitors: number
  pageviews: number
  topSource: string | null
  /** The same bucket of the previous period. */
  previousT: string
  previous: number
}

type ChartTooltipBodyProps = {
  /** Set by recharts while the pointer is over a bucket. */
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
  interval: StatsInterval
  /** The last bucket is still running, so its change is not final. */
  runningT: string | null
}

function isDatum(value: unknown): value is ChartDatum {
  return typeof value === "object" && value !== null && "visitors" in value
}

/**
 * The bucket's visitors and pageviews, visitors versus the same bucket of
 * the previous period, and where most of them came from.
 */
export function ChartTooltipBody({
  active,
  payload,
  interval,
  runningT,
}: ChartTooltipBodyProps) {
  const datum = payload?.[0]?.payload
  if (!active || !isDatum(datum)) return null
  const running = datum.t === runningT
  return (
    <div className="min-w-48 space-y-2 rounded-xl border border-border bg-surface/95 px-3 py-2.5 text-xs shadow-pop backdrop-blur">
      <p className="font-semibold">
        {tooltipLabel(datum.t, interval)}
        {running && (
          <span className="font-normal text-muted-foreground"> · so far</span>
        )}
      </p>
      <dl className="space-y-1.5">
        <Row swatch="h-0.5 w-3 rounded-full bg-chart-1" label="Visitors">
          <span className="inline-flex items-center gap-2">
            {formatNumber(datum.visitors)}
            {!running && (
              <ChangeIndicator
                change={countChange(datum.visitors, datum.previous)}
              />
            )}
          </span>
        </Row>
        <Row swatch="size-2 rounded-[2px] bg-chart-2" label="Pageviews">
          {formatNumber(datum.pageviews)}
        </Row>
        <Row
          swatch="h-0.5 w-3 rounded-full bg-chart-1 opacity-35"
          label={`Visitors, ${tooltipLabel(datum.previousT, interval)}`}
        >
          {formatNumber(datum.previous)}
        </Row>
      </dl>
      {datum.topSource && (
        <p className="flex items-center gap-1.5 border-t border-border pt-2 text-muted-foreground">
          Top source
          <Icon type="referrer" name={datum.topSource} className="size-4" />
          <span className="max-w-32 truncate font-medium text-foreground">
            {sourceLabel(datum.topSource)}
          </span>
        </p>
      )}
    </div>
  )
}

type RowProps = { swatch: string; label: string; children: React.ReactNode }

function Row({ swatch, label, children }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        <span aria-hidden="true" className={swatch} />
        {label}
      </dt>
      <dd className="font-semibold tabular-nums">{children}</dd>
    </div>
  )
}
