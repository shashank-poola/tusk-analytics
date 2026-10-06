/**
 * Calls `onChange` after every client-side navigation: history.pushState,
 * history.replaceState, and back/forward (popstate).
 */
export function onHistoryChange(onChange: () => void): void {
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method]
    history[method] = function (
      this: History,
      ...args: Parameters<History["pushState"]>
    ) {
      original.apply(this, args)
      onChange()
    }
  }
  addEventListener("popstate", onChange)
}
