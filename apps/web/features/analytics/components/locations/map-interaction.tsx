"use client"

import { useRef, useState } from "react"

import { useSetView } from "@/features/analytics/hooks/use-set-view"
import { formatNumber } from "@/features/analytics/utils/format"

type Hovered = { name: string; visitors: number; x: number; y: number }

const TOOLTIP_OFFSET_PX = 14

/**
 * Makes the server-drawn map interactive: a DataFast-style card follows the
 * pointer over a country (`data-country`, `data-visitors` on its path), and
 * a click on a visited country filters the dashboard through its `<a>`
 * with client-side navigation (next/link can't render inside an SVG).
 */
export function MapInteraction({ children }: { children: React.ReactNode }) {
  const { setView } = useSetView()
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<Hovered | null>(null)

  function onPointerMove(event: React.PointerEvent) {
    const country =
      event.target instanceof Element
        ? event.target.closest<SVGElement>("[data-country]")
        : null
    const box = ref.current?.getBoundingClientRect()
    if (!country || !box) {
      setHovered(null)
      return
    }
    setHovered({
      name: country.dataset.country ?? "",
      visitors: Number(country.dataset.visitors ?? 0),
      x: event.clientX - box.left,
      y: event.clientY - box.top,
    })
  }

  const flip = hovered && ref.current && hovered.x > ref.current.clientWidth / 2

  return (
    <div
      ref={ref}
      className="relative h-full w-full"
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHovered(null)}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return
        const link =
          event.target instanceof Element ? event.target.closest("a") : null
        const href = link?.getAttribute("href")
        if (!href?.startsWith("/")) return
        event.preventDefault()
        setView(href)
      }}
    >
      {children}
      {hovered && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 min-w-44 rounded-xl border border-border bg-surface/95 px-3.5 py-2.5 text-sm shadow-pop backdrop-blur"
          style={{
            top: hovered.y + TOOLTIP_OFFSET_PX,
            left: flip ? undefined : hovered.x + TOOLTIP_OFFSET_PX,
            right:
              flip && ref.current
                ? ref.current.clientWidth - hovered.x + TOOLTIP_OFFSET_PX
                : undefined,
          }}
        >
          <p className="border-b border-border pb-2 font-semibold">
            {hovered.name}
          </p>
          <p className="flex items-center justify-between gap-6 pt-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-3 rounded-[3px] bg-chart-1" />
              Visitors
            </span>
            <span className="font-semibold tabular-nums">
              {formatNumber(hovered.visitors)}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
