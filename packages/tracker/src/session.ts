import { readIdCookie, writeCookie } from "./cookie"

const SESSION_COOKIE = "vt_sid"
const SESSION_SECONDS = 30 * 60

// Kept so a page with blocked cookies still has sessions.
let current: { id: string; expiresAt: number } | undefined

/**
 * The visit this event belongs to. A visit ends after 30 minutes without an
 * event, or when `startNew` says the visitor arrived from somewhere new;
 * every event extends it.
 */
export function getSession(startNew = false): { id: string; isNew: boolean } {
  const now = Date.now()
  const existing = startNew
    ? null
    : (readIdCookie(SESSION_COOKIE) ??
      (current && current.expiresAt > now ? current.id : null))
  const id = existing ?? crypto.randomUUID()

  current = { id, expiresAt: now + SESSION_SECONDS * 1000 }
  writeCookie(SESSION_COOKIE, id, SESSION_SECONDS)
  return { id, isNew: !existing }
}
