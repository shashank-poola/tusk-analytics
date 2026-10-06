"use client"

import { RotateCw } from "lucide-react"
import { catchError, type ErrorInfo } from "next/error"
import { Suspense } from "react"

/** What a failed section shows instead of blanking the page. */
export function SectionError({
  title,
  onRetry,
}: {
  title: string
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm"
    >
      <p>
        Couldn&apos;t load {title}.{" "}
        <span className="text-muted-foreground">
          The rest of the page is fine.
        </span>
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 font-medium transition-colors hover:bg-muted sm:min-h-9"
      >
        <RotateCw aria-hidden="true" className="size-3.5" />
        Try again
      </button>
    </div>
  )
}

const SectionErrorBoundary = catchError(
  ({ title }: { title: string }, { retry }: ErrorInfo) => (
    <SectionError title={title} onRetry={retry} />
  )
)

type SectionBoundaryProps = {
  /** Used in the error message, e.g. "the chart". */
  title: string
  fallback: React.ReactNode
  children: React.ReactNode
}

/**
 * One loading and one error boundary per section, so a slow or failing query
 * doesn't hold up or blank the rest of the page. `retry` refetches.
 */
export function SectionBoundary({
  title,
  fallback,
  children,
}: SectionBoundaryProps) {
  return (
    <SectionErrorBoundary title={title}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </SectionErrorBoundary>
  )
}
