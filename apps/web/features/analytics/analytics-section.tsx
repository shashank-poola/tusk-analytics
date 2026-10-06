"use client"

import { catchError, type ErrorInfo } from "next/error"
import { Suspense } from "react"

function SectionError({ title }: { title: string }, { retry }: ErrorInfo) {
  return (
    <div role="alert" className="rounded-lg border border-border p-6 text-sm">
      <p>Couldn&apos;t load {title}.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-3 rounded-full border border-border px-4 py-1.5 transition-colors hover:bg-muted"
      >
        Try again
      </button>
    </div>
  )
}

const SectionErrorBoundary = catchError(SectionError)

type AnalyticsSectionProps = {
  /** Used in the error message, e.g. "the chart". */
  title: string
  fallback: React.ReactNode
  children: React.ReactNode
}

/**
 * One loading and one error boundary per section, so a slow or failing query
 * doesn't hold up or blank the rest of the page. `retry` refetches.
 */
export function AnalyticsSection({
  title,
  fallback,
  children,
}: AnalyticsSectionProps) {
  return (
    <SectionErrorBoundary title={title}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </SectionErrorBoundary>
  )
}
