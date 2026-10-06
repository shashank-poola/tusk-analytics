// crypto.randomUUID() output. Anything else in our cookies (edited by hand or
// by the host page) is replaced, so the collect endpoint never rejects it.
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/** The id stored in cookie `name`, or null if missing, invalid or blocked. */
export function readIdCookie(name: string): string | null {
  try {
    const value = document.cookie.match(`(?:^|; )${name}=([^;]*)`)?.[1]
    return value && UUID.test(value) ? value : null
  } catch {
    // Cookies can be blocked (sandboxed frames, browser settings).
    return null
  }
}

/** A first-party cookie on this host for `maxAge` seconds. */
export function writeCookie(name: string, value: string, maxAge: number): void {
  try {
    document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${
      location.protocol === "https:" ? "; Secure" : ""
    }`
  } catch {
    // Blocked: the caller's in-memory id then lasts for this page only.
  }
}
