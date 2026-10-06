/** Shown when the site has events, but none in the selected range. */
export function NoVisits() {
  return (
    <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      No visits in this period. Try a longer range.
    </p>
  )
}
