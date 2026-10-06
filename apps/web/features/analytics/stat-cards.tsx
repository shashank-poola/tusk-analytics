import type { StatsOverviewResponse } from "@workspace/contracts"

import {
  bounceRateChange,
  type Change,
  countChange,
  formatCompact,
  formatPercent,
} from "./format"

type StatCardsProps = { overview: StatsOverviewResponse }

/** Totals for the range, each compared with the previous period. */
export function StatCards({ overview: { current, previous } }: StatCardsProps) {
  const cards = [
    {
      label: "Visitors",
      value: formatCompact(current.visitors),
      change: countChange(current.visitors, previous.visitors),
    },
    {
      label: "Pageviews",
      value: formatCompact(current.pageviews),
      change: countChange(current.pageviews, previous.pageviews),
    },
    {
      label: "Sessions",
      value: formatCompact(current.sessions),
      change: countChange(current.sessions, previous.sessions),
    },
    {
      label: "Bounce rate",
      value: formatPercent(current.bounceRate),
      change: bounceRateChange(
        current.bounceRate,
        previous.bounceRate,
        previous.sessions
      ),
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-border p-4">
          <dt className="text-sm text-muted-foreground">{card.label}</dt>
          <dd className="mt-1 text-2xl tracking-tight">{card.value}</dd>
          <dd className="mt-1 text-sm text-muted-foreground">
            <ChangeText change={card.change} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

const ARROWS = { up: "↑", down: "↓", flat: "→" } as const

/** Direction as an arrow and a signed number, never as color alone. */
function ChangeText({ change }: { change: Change }) {
  if (change.direction === "none") {
    return (
      <>
        <span aria-hidden>–</span>
        <span className="sr-only">No data for the previous period</span>
      </>
    )
  }
  return (
    <>
      <span aria-hidden>{ARROWS[change.direction]} </span>
      {change.text} vs previous period
    </>
  )
}
