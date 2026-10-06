/**
 * Marks a link that sets the dashboard's view. The proxy (proxy.ts) keeps
 * the rest of the query in a cookie and redirects to the clean URL, so the
 * address bar never shows `?range=30d&country=IN…`.
 */
export const VIEW_PARAM = "view"

/** The dashboard's view: `viewSearch` in features/analytics/utils/analytics-params.ts. */
type SiteSearch = Record<string, string | undefined>

export const routes = {
  signIn: "/signup",
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  settings: "/settings",
  /** All of the user's websites. */
  sites: "/sites",
  installSnippet: (siteId: string) => `/onboarding/${siteId}`,
  /**
   * One website's dashboard. Without `search` it opens as the visitor left
   * it; with `search` (even an empty one) it sets the view first.
   */
  site: (siteId: string, search?: SiteSearch) => {
    if (!search) return `/site/${siteId}`
    const query = new URLSearchParams({ [VIEW_PARAM]: "1" })
    for (const [name, value] of Object.entries(search)) {
      if (value) query.set(name, value)
    }
    return `/site/${siteId}?${query}`
  },
  terms: "/terms",
  privacy: "/privacy",
} as const
