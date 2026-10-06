"use client"

import { Search } from "lucide-react"
import { useId } from "react"

type SearchFilterProps = {
  /** Visible to screen readers only, e.g. "Search visitors". */
  label: string
  placeholder: string
  /** The element whose `[data-search]` rows the input filters. */
  targetId: string
}

/**
 * Narrows a server-rendered list as you type by hiding rows whose
 * `data-search` text doesn't contain the query. The rows never travel to
 * the client as data.
 */
export function SearchFilter({
  label,
  placeholder,
  targetId,
}: SearchFilterProps) {
  const inputId = useId()
  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id={inputId}
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => {
          const query = event.target.value.trim().toLowerCase()
          const rows = document
            .getElementById(targetId)
            ?.querySelectorAll<HTMLElement>("[data-search]")
          for (const row of rows ?? []) {
            row.hidden = !(row.dataset.search ?? "").includes(query)
          }
        }}
        className="h-11 w-40 rounded-lg border border-border bg-background pr-2 pl-8 text-sm placeholder:text-muted-foreground sm:h-8 sm:w-48"
      />
    </div>
  )
}
