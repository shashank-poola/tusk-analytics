import { type Config, readConfig } from "./config"
import { send } from "./send"
import { getSession } from "./session"
import { onHistoryChange } from "./spa"
import { getVisitorId } from "./visitor"

// Everything runs inside try/catch: the tracker must never throw on a
// customer's page.

function start(config: Config): void {
  let lastPage: string | undefined

  function trackPageview(): void {
    try {
      // Pages that are prerendered but maybe never shown aren't visits.
      // (Cast: TypeScript's DOM types dropped the legacy "prerender" value.)
      if ((document.visibilityState as string) === "prerender") return
      // Path and query only: hash changes and replaceState calls that keep
      // the URL (many routers make one on load) aren't new pageviews.
      const page = location.pathname + location.search
      if (page === lastPage) return
      // document.referrer never changes after load, so SPA pageviews name
      // the previous page instead of repeating the external referrer.
      const referrer =
        lastPage === undefined ? document.referrer : location.origin + lastPage
      lastPage = page

      const session = getSession()
      send(config.endpoint, {
        siteId: config.siteId,
        name: "pageview",
        url: location.origin + page,
        referrer,
        visitorId: getVisitorId(),
        sessionId: session.id,
        newSession: session.isNew,
      })
    } catch {
      // Swallowed on purpose; see above.
    }
  }

  trackPageview()
  onHistoryChange(trackPageview)
}

try {
  const config = readConfig(document.currentScript)
  if (config) start(config)
} catch {
  // Swallowed on purpose; see above.
}
