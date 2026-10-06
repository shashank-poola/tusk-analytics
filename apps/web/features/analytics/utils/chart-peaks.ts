/** Short charts get fewer icons, so they don't crowd the line. */
function maxPeaks(points: number): number {
  if (points <= 8) return 2
  if (points <= 31) return 4
  return 5
}

/**
 * Indexes of the biggest peaks that have a top source to show: local
 * maxima of `values` (edges count), biggest first, at least a few points
 * apart so their icons never overlap. Returned in chart order.
 */
export function peakIndexes(
  values: number[],
  hasSource: (index: number) => boolean
): number[] {
  const minGap = Math.max(1, Math.floor(values.length / 10))
  const candidates = values
    .map((value, index) => ({ value, index }))
    .filter(({ value, index }) => {
      if (value <= 0 || !hasSource(index)) return false
      const before = values[index - 1] ?? -1
      const after = values[index + 1] ?? -1
      return value >= before && value >= after
    })
    .sort((a, b) => b.value - a.value || a.index - b.index)

  const picked: number[] = []
  for (const { index } of candidates) {
    if (picked.length === maxPeaks(values.length)) break
    if (picked.every((other) => Math.abs(other - index) >= minGap)) {
      picked.push(index)
    }
  }
  return picked.sort((a, b) => a - b)
}
