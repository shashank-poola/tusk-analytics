import type { StatsBreakdownResponse, StatsTotals } from "@workspace/contracts"

import { formatNumber, formatPercent, relativeChange } from "./format"
import { keyLabel } from "./labels"

/** Smaller changes aren't worth a sentence. */
const MIN_HIGHLIGHT_CHANGE = 0.05

export type Highlight = { kind: "source" | "page" | "change"; text: string }

type Row = StatsBreakdownResponse["rows"][number]

type HighlightInput = {
  current: StatsTotals
  previous: StatsTotals
  /** Sorted by visitors, as the breakdown API returns them. */
  sources: Row[]
  pages: Row[]
}

const visitorCount = (count: number) =>
  count === 1 ? "1 visitor" : `${formatNumber(count)} visitors`

/**
 * The clear winner of a breakdown: it needs a known key, visitors, and at
 * least one other row with fewer visitors, or "best" wouldn't be true.
 */
function clearWinner(rows: Row[]): (Row & { key: string }) | null {
  const [top, runnerUp] = rows
  if (!top || !runnerUp || top.key === null || top.visitors === 0) return null
  if (runnerUp.visitors >= top.visitors) return null
  return { ...top, key: top.key }
}

function sourceHighlight(sources: Row[]): Highlight | null {
  const top = clearWinner(sources)
  if (!top) return null
  const count = visitorCount(top.visitors)
  return {
    kind: "source",
    text:
      top.key === "direct"
        ? `${count} came directly, more than from any other source.`
        : `${keyLabel("source", top.key)} sent ${count}, your best source.`,
  }
}

function pageHighlight(pages: Row[]): Highlight | null {
  const top = clearWinner(pages)
  if (!top) return null
  return {
    kind: "page",
    text: `${top.key === "/" ? "Your home page was the" : `${top.key} was your`} top page, seen by ${visitorCount(top.visitors)}.`,
  }
}

const COUNT_METRICS = [
  ["visitors", "Visitors"],
  ["pageviews", "Pageviews"],
  ["sessions", "Sessions"],
] as const

function changeHighlight({
  current,
  previous,
}: HighlightInput): Highlight | null {
  let biggest: { label: string; change: number } | null = null
  for (const [metric, label] of COUNT_METRICS) {
    const change = relativeChange(current[metric], previous[metric])
    if (change === null || Math.abs(change) < MIN_HIGHLIGHT_CHANGE) continue
    if (!biggest || Math.abs(change) > Math.abs(biggest.change)) {
      biggest = { label, change }
    }
  }
  if (!biggest) return null
  const direction = biggest.change > 0 ? "up" : "down"
  return {
    kind: "change",
    text: `${biggest.label} are ${direction} ${formatPercent(Math.abs(biggest.change))} on the previous period.`,
  }
}

/**
 * Up to three plain sentences about the range: the best source, the top
 * page and the biggest change. A sentence is left out unless the data makes
 * it true.
 */
export function buildHighlights(input: HighlightInput): Highlight[] {
  return [
    sourceHighlight(input.sources),
    pageHighlight(input.pages),
    changeHighlight(input),
  ].filter((highlight) => highlight !== null)
}
