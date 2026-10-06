import { TallyMarks } from "@/components/brand/tally-marks"
import { Card } from "@/components/dashboard/card"

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

export function KpiCardsSkeleton() {
  return (
    <div
      role="status"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
    >
      {["visitors", "pageviews", "sessions", "bounce"].map((key) => (
        <Card key={key} className="space-y-4 p-4 sm:p-5">
          <Bar className="h-4 w-20" />
          <Bar className="h-8 w-16" />
          <Bar className="h-6 w-14 rounded-full" />
        </Card>
      ))}
      <Loading label="totals" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div
      role="status"
      className="flex h-56 flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:h-72"
    >
      <TallyMarks animate className="size-8 text-accent" />
      Counting visits…
    </div>
  )
}

export function BreakdownSkeleton() {
  return (
    <div role="status" className="space-y-3 py-1">
      {["w-11/12", "w-3/4", "w-1/2", "w-2/5", "w-1/4"].map((width) => (
        <Bar key={width} className={`h-8 ${width}`} />
      ))}
      <Loading label="breakdown" />
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
