// Tusk for app code: adds the hosted tracking script once and sends goals.
// Safe to import in server code: nothing runs until a browser calls it.

/** Where Tusk serves its script. [CONFIRM] the production host. */
export const DEFAULT_SCRIPT_URL = "https://usetusk.dev/script.js"

const SITE_ID = /^vt_[0-9a-z]{16}$/
const SCRIPT_ID = "tusk-analytics"

export type TuskOptions = {
  /** The site's id from the Tusk dashboard, e.g. "vt_3k9x2m7qpd4n8r1t". */
  siteId: string
  /** No cookies at all: visitors are counted per page load (EU without consent). */
  cookieless?: boolean
  /** Count visits on localhost too, while you test. */
  allowLocalhost?: boolean
  /** A self-hosted or proxied copy of the script. */
  scriptUrl?: string
}

type GoalQueue = ((goal: string) => void) & { q?: unknown[][] }
type TuskWindow = Window & { viewtally?: GoalQueue }

/**
 * Adds Tusk's script to the page, the same tag the install snippet adds.
 * Calling it again does nothing, so it can sit in a component that
 * renders often. On the server it does nothing.
 */
export function initTusk(options: TuskOptions): void {
  if (typeof document === "undefined") return
  if (document.getElementById(SCRIPT_ID)) return
  if (!SITE_ID.test(options.siteId)) {
    console.warn(
      `Tusk: "${options.siteId}" isn't a site id. Copy it from your dashboard; it looks like vt_3k9x2m7qpd4n8r1t.`
    )
    return
  }

  const script = document.createElement("script")
  script.id = SCRIPT_ID
  script.defer = true
  script.src = options.scriptUrl ?? DEFAULT_SCRIPT_URL
  script.dataset.site = options.siteId
  if (options.cookieless) script.dataset.cookieless = "true"
  if (options.allowLocalhost) script.dataset.allowLocalhost = "true"
  document.head.append(script)
}

/**
 * Sends a goal, like `track("signup")`: a lowercase slug of letters,
 * digits, `-` and `_`. Goals sent before the script has loaded wait in a
 * queue the script reads when it starts.
 */
export function track(goal: string): void {
  if (typeof window === "undefined") return
  const host = window as TuskWindow
  if (!host.viewtally) {
    const queue: GoalQueue = (name) => {
      queue.q ??= []
      queue.q.push([name])
    }
    host.viewtally = queue
  }
  host.viewtally(goal)
}
