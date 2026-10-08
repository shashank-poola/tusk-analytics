"use client"

import { RotateCw } from "lucide-react"
import { catchError, type ErrorInfo } from "next/error"
import { Suspense } from "react"

import { BUTTON_CLASSES } from "@/components/ui/button-styles"

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
        className={BUTTON_CLASSES.secondary}
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
