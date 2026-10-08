export type Config = {
  siteId: string
  endpoint: string
  /** No cookies at all: ids last for the page only (EU sites without consent). */
  cookieless: boolean
}

function isLocalPage(): boolean {
  return (
    location.protocol === "file:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  )
}

/** Owners exclude their own visits by setting localStorage.vt_ignore to any value. */
function isIgnored(): boolean {
  try {
    return localStorage.getItem("vt_ignore") !== null
  } catch {
    return false
  }
}

/**
 * Reads the tracker's settings from its script tag:
 * `<script defer data-site="vt_…" src="https://…/script.js">`, plus
 * `data-cookieless="true"` to set no cookies.
 * Returns null when this page must not be tracked.
 */
export function readConfig(script: Element | null): Config | null {
  if (!(script instanceof HTMLScriptElement)) return null
  const { site, api, allowLocalhost, cookieless } = script.dataset
  if (!site) return null
  if (isLocalPage() && allowLocalhost !== "true") return null
  if (isIgnored()) return null

  return {
    siteId: site,
    // data-api points the tracker at another origin, for proxies.
    endpoint: new URL("/api/v1/collect", api || script.src).href,
    cookieless: cookieless === "true",
  }
}
