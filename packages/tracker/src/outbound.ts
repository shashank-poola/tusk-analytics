const bareHost = (host: string) => host.replace(/^www\./, "")

/**
 * Calls `onClick` with the address (no query or hash) of each link the
 * visitor follows to another site, by left or middle click. Listens on
 * window in the capture phase, so a page that stops the click's
 * propagation can't hide it.
 */
export function onOutboundClick(onClick: (href: string) => void): void {
  function listener(event: Event): void {
    try {
      const target = event.target
      const link = target instanceof Element ? target.closest("a[href]") : null
      if (!(link instanceof HTMLAnchorElement)) return
      if (link.protocol !== "http:" && link.protocol !== "https:") return
      if (bareHost(link.hostname) === bareHost(location.hostname)) return
      // No query or hash: they can carry tokens, and the server drops them anyway.
      onClick(link.origin + link.pathname)
    } catch {
      // Swallowed on purpose: the tracker must never throw on the page.
    }
  }
  addEventListener("click", listener, true)
  addEventListener("auxclick", listener, true)
}
