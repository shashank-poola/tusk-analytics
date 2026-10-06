import { type Config, readConfig } from "./config"
import { onOutboundClick } from "./outbound"
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

      send(config.endpoint, { ...eventFields(referrer), name: "pageview" })
    } catch {
      // Swallowed on purpose; see above.
    }
  }

  /** What every event carries; extends the session like any event. */
  function eventFields(referrer: string) {
    const session = getSession()
    return {
      siteId: config.siteId,
      url: location.origin + location.pathname + location.search,
      referrer,
      visitorId: getVisitorId(),
      sessionId: session.id,
      newSession: session.isNew,
    }
  }

  trackPageview()
  onHistoryChange(trackPageview)
  onOutboundClick((href) =>
    send(config.endpoint, { ...eventFields(""), name: "outbound", href })
  )
}

try {
  const config = readConfig(document.currentScript)
  if (config) start(config)
} catch {
  // Swallowed on purpose; see above.
}
