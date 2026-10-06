import type { StatsRange, StatsTotals } from "@workspace/contracts"

import { RANGE_PERIODS } from "./analytics-params"
import { formatNumber, formatPercent, relativeChange } from "./format"

/** Below this, a change reads as "about the same". */
const FLAT_CHANGE = 0.01

export function previousPeriod(range: StatsRange): string {
  return RANGE_PERIODS[range].replace("the last", "the previous")
}

/** "Hey Ada, 1,204 people visited myapp.com in the last 7 days." */
export function greetingHeadline({
  name,
  domain,
  range,
  visitors,
}: {
  name: string | null
  domain: string
  range: StatsRange
  visitors: number
}): string {
  const firstName = name?.trim().split(/\s+/)[0]
  const hey = firstName ? `Hey ${firstName}` : "Hey there"
  const period = RANGE_PERIODS[range]
  if (visitors === 0) return `${hey}, ${domain} had no visitors in ${period}.`
  const people =
    visitors === 1 ? "1 person" : `${formatNumber(visitors)} people`
  return `${hey}, ${people} visited ${domain} in ${period}.`
}

/** One line on visitors versus the previous period. */
export function greetingDetail(
  range: StatsRange,
  current: StatsTotals,
  previous: StatsTotals
): string {
  const before = previousPeriod(range)
  const change = relativeChange(current.visitors, previous.visitors)
  if (change === null) {
    return current.visitors === 0
      ? `Nobody visited in ${before} either.`
      : `Nobody visited in ${before}, so there's nothing to compare yet.`
  }
  if (Math.abs(change) < FLAT_CHANGE) return `About the same as ${before}.`
  const amount = formatPercent(Math.abs(change))
  return change > 0
    ? `That's ${amount} more than ${before}.`
    : `That's ${amount} fewer than ${before}.`
}
