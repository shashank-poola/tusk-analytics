import { Card } from "@/components/ui/card"

type OverviewCardProps = {
  /** The KPI strip; streams in on its own. */
  totals: React.ReactNode
  /** The chart; streams in on its own. */
  chart: React.ReactNode
}

/** The headline numbers directly on top of the chart, in one card. */
export function OverviewCard({ totals, chart }: OverviewCardProps) {
  return (
    <Card aria-label="Overview" className="overflow-hidden">
      <section aria-label="Totals">{totals}</section>
      <div className="px-3 pb-3 sm:px-5 sm:pb-4">{chart}</div>
    </Card>
  )
}
