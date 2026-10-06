import type { BreakdownBy, StatsRange } from "@workspace/contracts"

/** `?range=` plus each breakdown card's open tab (analytics-params.ts). */
type SiteSearch = {
  range?: StatsRange
  sources?: BreakdownBy
  pages?: BreakdownBy
  locations?: BreakdownBy
  devices?: BreakdownBy
}

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
