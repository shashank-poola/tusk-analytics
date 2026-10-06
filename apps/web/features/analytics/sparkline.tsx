import { sparklinePath } from "./sparkline-path"

const BOX = { width: 96, height: 32, padding: 2 }

/** A tiny trend line for a KPI card. Decorative: the card has the number. */
export function Sparkline({ values }: { values: readonly number[] }) {
  const d = sparklinePath(values, BOX)
  if (!d) return null
  return (
    <svg
      viewBox={`0 0 ${BOX.width} ${BOX.height}`}
      aria-hidden="true"
      className="h-8 w-24 text-chart-1"
      fill="none"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
