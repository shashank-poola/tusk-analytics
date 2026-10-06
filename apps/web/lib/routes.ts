/** The dashboard's view: `viewSearch` in features/analytics/utils/analytics-params.ts. */
type SiteSearch = Record<string, string | undefined>

export const routes = {
  signIn: "/signup",
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  settings: "/settings",
  installSnippet: (siteId: string) => `/onboarding/${siteId}`,
  site: (siteId: string, search: SiteSearch = {}) => {
    const query = new URLSearchParams()
    for (const [name, value] of Object.entries(search)) {
      if (value) query.set(name, value)
    }
    return query.size ? `/sites/${siteId}?${query}` : `/sites/${siteId}`
  },
  terms: "/terms",
  privacy: "/privacy",
} as const
