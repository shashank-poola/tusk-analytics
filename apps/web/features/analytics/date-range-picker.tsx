"use client"

import type { StatsRange } from "@workspace/contracts"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { parseRange, RANGE_LABELS } from "./analytics-params"

/** Writes `?range=` and keeps the other params, so views stay shareable. */
export function DateRangePicker() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const range = parseRange(searchParams.get("range") ?? undefined)

  function select(next: string) {
    const params = new URLSearchParams(searchParams)
    params.set("range", next)
    startTransition(() => router.push(`${pathname}?${params}`))
  }

  return (
    <label>
      <span className="sr-only">Date range</span>
      <select
        value={range}
        onChange={(event) => select(event.target.value)}
        aria-busy={isPending}
        className="rounded-full border border-border bg-background px-4 py-2 text-sm"
      >
        {(Object.keys(RANGE_LABELS) as StatsRange[]).map((value) => (
          <option key={value} value={value}>
            {RANGE_LABELS[value]}
          </option>
        ))}
      </select>
    </label>
  )
}
