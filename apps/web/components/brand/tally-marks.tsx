import { cn } from "@workspace/ui/lib/utils"

// Four upright marks and the diagonal that closes the group of five.
const MARKS = [
  "M5 4v16",
  "M9.5 4v16",
  "M14 4v16",
  "M18.5 4v16",
  "M2.5 17.5 21 6.5",
] as const

const STAGGER_MS = 40

type TallyMarksProps = {
  className?: string
  /** Draw the marks in once, one after another (≈ 300 ms in total). */
  animate?: boolean
  /** Thicker strokes for small sizes such as the logo. */
  strokeWidth?: number
}

/** Viewtally's motif. Decorative: always pair it with text. */
export function TallyMarks({
  className,
  animate = false,
  strokeWidth = 2,
}: TallyMarksProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {MARKS.map((d, index) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          strokeDasharray={animate ? 1 : undefined}
          className={animate ? "animate-draw" : undefined}
          style={
            animate ? { animationDelay: `${index * STAGGER_MS}ms` } : undefined
          }
        />
      ))}
    </svg>
  )
}
