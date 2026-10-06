"use client"

import { useCountUp } from "@/hooks/use-count-up"

import { formatCompact, formatPercent } from "./format"

const FORMATS = {
  count: (value: number) => formatCompact(Math.round(value)),
  percent: formatPercent,
} as const

type CountUpProps = { value: number; format: keyof typeof FORMATS }

/**
 * A number that counts up when it first shows and when it changes. Screen
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
