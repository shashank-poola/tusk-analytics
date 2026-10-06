/** The dashboard view kept per site, as a query string: `range=30d&country=IN`. */
export const VIEW_COOKIE = "vt_view"

/** Browsers keep at least 4 KB per cookie; stay clear of it. */
export const MAX_VIEW_COOKIE_LENGTH = 3000

export const VIEW_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

/** The period of the /sites list: `24h`, `7d` or `30d`. */
export const SITES_RANGE_COOKIE = "vt_sites_range"
