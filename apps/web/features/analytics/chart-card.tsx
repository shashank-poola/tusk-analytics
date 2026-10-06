import { Card } from "@/components/dashboard/card"

/** The chart's frame and legend; the chart itself streams in. */
export function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <Card aria-labelledby="chart-heading" className="p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 id="chart-heading" className="font-medium">
          Visitors over time
        </h2>
        <ul className="flex gap-4 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-chart-1"
            />
            Visitors
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-chart-2"
            />
            Pageviews
          </li>
        </ul>
      </div>
      {children}
    </Card>
  )
}
