import { isHostname, isIpAddress, LOCALHOST } from "@workspace/contracts"

/**
 * HTTP for the favicon lookup. Every URL it requests, including each redirect
 * hop, must pass `isFetchableUrl`: the URLs come from customer HTML and
 * redirects, so they are untrusted.
 */
const FETCH_TIMEOUT_MS = 3_000
const MAX_REDIRECTS = 3
const USER_AGENT = "ViewtallyFaviconBot/1.0 (+https://viewtally.com)"
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const PRIVATE_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"]

export type Outcome<T> = { ok: true; value: T } | { ok: false; reason: string }

/** https on the default port to a public DNS name; no IPs, no credentials. */
export function isFetchableUrl(url: URL): boolean {
  const host = url.hostname
  return (
    url.protocol === "https:" &&
    url.port === "" &&
    url.username === "" &&
    url.password === "" &&
    host !== LOCALHOST &&
    !isIpAddress(host) &&
    isHostname(host) &&
    !PRIVATE_SUFFIXES.some((suffix) => host.endsWith(suffix))
  )
}

export function mimeType(res: Response): string {
  const [type = ""] = (res.headers.get("content-type") ?? "").split(";", 1)
  return type.trim().toLowerCase()
}

function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  return String(error)
}

/**
 * GET that follows at most `MAX_REDIRECTS` redirects itself, checking every
 * hop. One timeout covers all hops and the body read. Network errors and
 * timeouts become a failed outcome. `url` is the final URL.
 */
export async function getPublic(
  start: URL,
  accept: string
): Promise<Outcome<{ res: Response; url: URL }>> {
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  let url = start
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isFetchableUrl(url)) {
      return { ok: false, reason: "refused a non-public or non-https URL" }
    }

    let res: Response
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal,
        headers: { Accept: accept, "User-Agent": USER_AGENT },
      })
    } catch (error) {
      return { ok: false, reason: describeError(error) }
    }

    if (REDIRECT_STATUSES.has(res.status)) {
      const location = res.headers.get("location") ?? ""
      await res.body?.cancel()
      if (!URL.canParse(location, url.href)) {
        return { ok: false, reason: `status ${res.status} without a Location` }
      }
      url = new URL(location, url)
      continue
    }
    if (res.ok) return { ok: true, value: { res, url } }
    await res.body?.cancel()
    return { ok: false, reason: `status ${res.status}` }
  }
  return { ok: false, reason: `more than ${MAX_REDIRECTS} redirects` }
}

/**
 * Reads at most `maxBytes` of `res`, then stops downloading. `truncated` says
 * whether the body was longer.
 */
export async function readAtMost(
  res: Response,
  maxBytes: number
): Promise<Outcome<{ bytes: Uint8Array<ArrayBuffer>; truncated: boolean }>> {
  if (!res.body) {
    return { ok: true, value: { bytes: new Uint8Array(), truncated: false } }
  }

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (size <= maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.byteLength
    }
    const truncated = size > maxBytes
    if (truncated) await reader.cancel()

    const bytes = new Uint8Array(Math.min(size, maxBytes))
    let offset = 0
    for (const chunk of chunks) {
      const part = chunk.subarray(0, bytes.length - offset)
      bytes.set(part, offset)
      offset += part.length
    }
    return { ok: true, value: { bytes, truncated } }
  } catch (error) {
    // The timeout signal also aborts a slow body mid-read.
    return { ok: false, reason: describeError(error) }
  }
}
