type SparklineBox = { width: number; height: number; padding: number }

/**
 * An SVG path through `values`, scaled to fit the box. Empty input gives "";
 * one point or a flat series gives a flat line through the middle, so a
 * steady metric doesn't look like zero.
 */
export function sparklinePath(
  values: readonly number[],
  { width, height, padding }: SparklineBox
): string {
  if (values.length === 0) return ""

  const min = Math.min(...values)
  const max = Math.max(...values)
  const middle = height / 2
  const usable = height - padding * 2
  const y = (value: number) =>
    max === min
      ? middle
      : padding + usable - ((value - min) / (max - min)) * usable

  if (values.length === 1) {
    const level = round(y(values[0] ?? 0))
    return `M${padding} ${level}H${width - padding}`
  }

  const step = (width - padding * 2) / (values.length - 1)
  return values
    .map((value, index) => {
      const command = index === 0 ? "M" : "L"
      return `${command}${round(padding + index * step)} ${round(y(value))}`
    })
    .join("")
}

const round = (value: number) => Math.round(value * 10) / 10
