"use client"

import { Maximize2, X } from "lucide-react"
import { useId, useRef } from "react"

import { SearchFilter } from "@/features/analytics/components/search-filter"

type BreakdownDialogProps = {
  title: string
  count: number
  /** The full table, rendered on the server. */
  children: React.ReactNode
}

/**
 * "Details" for a breakdown card, as DataFast's: a tall modal with the
 * title, a search box and close on top and the full table below, the same
 * size whatever the number of rows. A native <dialog>: focus moves in and
 * back, Escape closes it, and the page behind is inert.
 */
export function BreakdownDialog({
  title,
  count,
  children,
}: BreakdownDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const listId = `details-${useId().replace(/[^\w-]/g, "")}`

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:min-h-8"
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
        className="m-auto h-[min(42rem,85svh)] w-[min(32rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.25rem] border-2 border-border bg-surface p-0 text-foreground shadow-pop backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex open:animate-rise"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <h2 className="shrink-0 text-lg leading-snug">{title}</h2>
          <SearchFilter
            label={`Search ${title.toLowerCase()}`}
            placeholder="Search…"
            targetId={listId}
          />
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="-mr-1 ml-auto inline-grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-9"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div id={listId} className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>
      </dialog>
    </>
  )
}
