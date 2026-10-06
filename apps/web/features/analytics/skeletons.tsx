function Loading({ label, className }: { label: string; className: string }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Loading {label}…</span>
    </div>
  )
}

export function StatCardsSkeleton() {
  return (
    <Loading
      label="totals"
      className="h-[7.5rem] animate-pulse rounded-lg bg-muted"
    />
  )
}

export function ChartSkeleton() {
  return (
    <Loading label="chart" className="h-64 animate-pulse rounded-lg bg-muted" />
  )
}

export function BreakdownSkeleton() {
  return (
    <Loading
      label="breakdown"
      className="h-48 animate-pulse rounded-lg bg-muted"
    />
  )
}
