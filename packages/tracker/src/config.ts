export type Config = {
  siteId: string
  endpoint: string
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
 * `<script defer data-site="vt_…" src="https://…/script.js">`.
 * Returns null when this page must not be tracked.
 */
export function readConfig(script: Element | null): Config | null {
  if (!(script instanceof HTMLScriptElement)) return null
  const { site, api, allowLocalhost } = script.dataset
  if (!site) return null
  if (isLocalPage() && allowLocalhost !== "true") return null
  if (isIgnored()) return null

  return {
    siteId: site,
    // data-api points the tracker at another origin, for proxies.
    endpoint: new URL("/api/v1/collect", api || script.src).href,
  }
}
