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
      <section aria-label="Totals" className="border-b border-border">
        {totals}
      </section>
      <div className="p-3 pt-5 sm:p-5">
        {chart}
        <ul className="mt-2 flex justify-end gap-4 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0.5 w-3 rounded-full bg-chart-1"
            />
            Visitors
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-[2px] bg-chart-2"
            />
            Pageviews
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="w-3 border-t-2 border-dashed border-chart-1"
            />
            In progress
          </li>
        </ul>
      </div>
    </Card>
  )
}
