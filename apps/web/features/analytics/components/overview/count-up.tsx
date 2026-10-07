"use client"

import { useCountUp } from "@/features/analytics/hooks/use-count-up"

import {
  formatCompact,
  formatDuration,
  formatPercent,
} from "@/features/analytics/utils/format"

const FORMATS = {
  count: (value: number) => formatCompact(Math.round(value)),
  percent: formatPercent,
  duration: formatDuration,
} as const

export type CountUpFormat = keyof typeof FORMATS

type CountUpProps = { value: number; format: CountUpFormat }

/**
 * A number that counts up when it first shows. Screen
 * readers only get the final value.
 */
export function CountUp({ value, format }: CountUpProps) {
  const shown = useCountUp(value)
  const formatValue = FORMATS[format]
  return (
    <>
      <span aria-hidden="true">{formatValue(shown)}</span>
      <span className="sr-only">{formatValue(value)}</span>
    </>
  )
}
