type GoalFunction = ((goal: unknown) => void) & { q?: unknown[][] }

/** Same rule as the collect endpoint; anything else would be rejected. */
const GOAL_NAME = /^[a-z0-9][a-z0-9_-]{0,63}$/

/**
 * Calls `onGoal` for `window.viewtally("signup")` (including calls queued
 * before the script loaded, on `window.viewtally.q`) and for clicks on
 * elements with `data-vt-goal="signup"`. Names are trimmed and lowercased;
 * invalid ones are ignored.
 */
export function onGoal(onGoal: (goal: string) => void): void {
  const host = window as unknown as { viewtally?: GoalFunction }
  const queued = host.viewtally?.q ?? []

  function track(goal: unknown): void {
    try {
      const name = typeof goal === "string" ? goal.trim().toLowerCase() : ""
      if (GOAL_NAME.test(name) && name !== "pageview" && name !== "outbound") {
        onGoal(name)
      }
    } catch {
      // Swallowed on purpose: the tracker must never throw on the page.
    }
  }

  host.viewtally = track
  for (const args of queued) track(args[0])
  addEventListener(
    "click",
    (event) => {
      const target = event.target
      const element =
        target instanceof Element ? target.closest("[data-vt-goal]") : null
      if (element) track(element.getAttribute("data-vt-goal"))
    },
    true
  )
}
