import { TallyMarks } from "@/components/brand/tally-marks"
import { Card } from "@/components/ui/card"

// Static shapes that match the real layout, so nothing jumps when data
// arrives. No shimmer loop: the only motion is tally marks drawing in once.

function Bar({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-md bg-muted ${className}`}
    />
  )
}

function Loading({ label }: { label: string }) {
  return <span className="sr-only">Loading {label}…</span>
}

export function GreetingSkeleton() {
  return (
    <div role="status" className="space-y-3">
      <Bar className="h-8 w-full max-w-xl" />
      <Bar className="h-4 w-64" />
      <Loading label="summary" />
    </div>
  )
}

export function KpiStripSkeleton() {
  return (
    <div
      role="status"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
    >
      {["visitors", "pageviews", "bounce", "time", "online"].map((key) => (
        <div
          key={key}
          className="space-y-3 border-border px-4 py-4 sm:px-5 lg:border-r lg:last:border-r-0"
        >
          <Bar className="h-4 w-20" />
          <Bar className="h-7 w-16" />
          <Bar className="h-6 w-14 rounded-full" />
        </div>
      ))}
      <Loading label="totals" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div
      role="status"
      className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:h-80"
    >
      <TallyMarks animate className="size-8 text-accent" />
      Counting visits…
    </div>
  )
}

const ROW_WIDTHS = [
  "w-full",
  "w-11/12",
  "w-3/4",
  "w-3/5",
  "w-1/2",
  "w-2/5",
  "w-1/3",
  "w-1/4",
]

export function BreakdownSkeleton() {
  return (
    <div role="status" className="space-y-1">
      {ROW_WIDTHS.map((width) => (
        <Bar key={width} className={`h-9 rounded-lg ${width}`} />
      ))}
      <Loading label="breakdown" />
    </div>
  )
}

export function VisitorsSkeleton() {
  return (
    <div role="status" className="space-y-1 px-3">
      {["a", "b", "c", "d", "e", "f"].map((key) => (
        <div key={key} className="flex items-center gap-3 py-3">
          <Bar className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bar className="h-4 w-32" />
            <Bar className="h-3 w-48" />
          </div>
        </div>
      ))}
      <Loading label="visitors" />
    </div>
  )
}

export function HighlightsSkeleton() {
  return (
    <Card role="status" className="space-y-3 p-5">
      <Bar className="h-4 w-24" />
      <Bar className="h-4 w-full max-w-md" />
      <Bar className="h-4 w-full max-w-sm" />
      <Loading label="highlights" />
    </Card>
  )
}
