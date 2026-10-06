"use client"

import { Maximize2, X } from "lucide-react"
import { useRef } from "react"

type BreakdownDialogProps = {
  title: string
  count: number
  /** The full list, rendered on the server. */
  children: React.ReactNode
}

/**
 * "View all" for a breakdown card, as a native <dialog>: focus moves in and
 * back, Escape closes it, and the page behind is inert.
 */
export function BreakdownDialog({
  title,
  count,
  children,
}: BreakdownDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted hover:text-foreground sm:min-h-8"
      >
        <Maximize2 aria-hidden="true" className="size-3" />
        Details
        <span className="sr-only">
          : all {count} {title.toLowerCase()}
        </span>
      </button>
      <dialog
        ref={dialogRef}
        aria-label={title}
        onClick={(event) => {
          // A click on the backdrop lands on the <dialog> itself.
          if (event.target === event.currentTarget) dialogRef.current?.close()
        }}
        className="m-auto max-h-[85svh] w-[min(36rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-pop backdrop:bg-foreground/30 backdrop:backdrop-blur-[2px] open:animate-rise"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
          <h2 className="font-medium">{title}</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="-mr-2 inline-grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-9"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="max-h-[calc(85svh-3.5rem)] overflow-y-auto p-3">
          {children}
        </div>
      </dialog>
    </>
  )
}
