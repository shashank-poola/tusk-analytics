// A smooth sparkline as SVG path data, without a chart library. Monotone
// cubic interpolation (Fritsch–Carlson), the same family as the main
// chart's curve: it bends smoothly but never overshoots, so a flat run of
// zeros stays on the baseline.

type Point = { x: number; y: number }

/** Slopes at each point that keep the curve monotone between points. */
function tangents(points: Point[]): number[] {
  const slopes = points.slice(1).map((point, index) => {
    const before = points[index] as Point
    return (point.y - before.y) / (point.x - before.x)
  })
  return points.map((_, index) => {
    const left = slopes[index - 1]
    const right = slopes[index]
    if (left === undefined) return right ?? 0
    if (right === undefined) return left
    // A peak, a valley or a flat side: no slope, so no overshoot.
    if (left * right <= 0) return 0
    return (2 * left * right) / (left + right)
  })
}

/**
 * `values` drawn left to right across `width`, scaled so the largest
 * touches the top and 0 the bottom (`inset` px kept clear for the stroke).
 */
export function sparklinePath(
  values: number[],
  width: number,
  height: number,
  inset = 2
): string {
  if (values.length === 0) return ""
  const max = Math.max(1, ...values)
  const step = values.length > 1 ? width / (values.length - 1) : 0
  const points = values.map((value, index) => ({
    x: index * step,
    y: inset + (1 - value / max) * (height - inset * 2),
  }))
  const slope = tangents(points)
  const round = (n: number) => Math.round(n * 100) / 100

  let path = `M${round(points[0]?.x ?? 0)},${round(points[0]?.y ?? 0)}`
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1] as Point
    const to = points[index] as Point
    const third = (to.x - from.x) / 3
    path += ` C${round(from.x + third)},${round(from.y + (slope[index - 1] ?? 0) * third)} ${round(to.x - third)},${round(to.y - (slope[index] ?? 0) * third)} ${round(to.x)},${round(to.y)}`
  }
  return path
}
