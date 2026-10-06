import { readIdCookie, writeCookie } from "./cookie"

const VISITOR_COOKIE = "vt_vid"
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

// Kept so a page with blocked cookies still sends one visitor id.
let visitorId: string | undefined

/**
 * The random id that ties a visitor's events and later payments together.
 * Set once for a year, not extended on later visits.
 */
export function getVisitorId(): string {
  const stored = readIdCookie(VISITOR_COOKIE)
  if (stored) {
    visitorId = stored
    return stored
  }

  visitorId ||= crypto.randomUUID()
  writeCookie(VISITOR_COOKIE, visitorId, ONE_YEAR_SECONDS)
  return visitorId
}
