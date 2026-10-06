import { Info } from "lucide-react"
import { useId } from "react"

type MetricHintProps = { label: string; hint: string }

/**
 * The metric's name with a one-line definition that shows on hover and on
 * keyboard focus, laid over its card (the nearest positioned ancestor) so it
 * can never overflow the screen. Screen readers get it as the button's description.
 */
export function MetricHint({ label, hint }: MetricHintProps) {
  const hintId = useId()
  return (
    <span className="group/hint inline-flex items-center gap-1">
      <span>{label}</span>
      <button
        type="button"
        aria-label={`About ${label.toLowerCase()}`}
        aria-describedby={hintId}
        className="-m-3.5 inline-grid size-11 place-items-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
      >
        <Info aria-hidden="true" className="size-3.5" />
      </button>
      <span
        id={hintId}
        role="tooltip"
        className="pointer-events-none absolute inset-x-3 top-11 z-20 hidden animate-rise rounded-lg border border-border bg-surface px-3 py-2 text-xs font-normal text-foreground shadow-pop group-focus-within/hint:block group-hover/hint:block"
      >
        {hint}
      </span>
    </span>
  )
}
