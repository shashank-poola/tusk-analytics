import type { CollectPayload } from "@workspace/contracts"

/**
 * Fire and forget. A text/plain body is a "simple" request, so the browser
 * sends it cross-origin without a CORS preflight. sendBeacon survives the
 * page unloading; fetch with keepalive covers browsers that lack it or
 * refuse the beacon (queue full).
 */
export function send(endpoint: string, payload: CollectPayload): void {
  const body = new Blob([JSON.stringify(payload)], { type: "text/plain" })
  try {
    if (navigator.sendBeacon(endpoint, body)) return
  } catch {
    // Missing or blocked sendBeacon: fall back to fetch.
  }
  fetch(endpoint, {
    method: "POST",
    body,
    keepalive: true,
    credentials: "omit",
  }).catch(() => {
    // Offline or blocked by an ad blocker; analytics never retries.
  })
}
