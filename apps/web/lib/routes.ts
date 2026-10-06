import type { BreakdownBy, StatsRange } from "@workspace/contracts"

type SiteSearch = { range?: StatsRange; tab?: BreakdownBy }

export const routes = {
  signIn: "/signup",
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  installSnippet: (siteId: string) => `/onboarding/${siteId}`,
  site: (siteId: string, { range, tab }: SiteSearch = {}) => {
    const query = new URLSearchParams()
    if (range) query.set("range", range)
    if (tab) query.set("tab", tab)
    return query.size ? `/sites/${siteId}?${query}` : `/sites/${siteId}`
  },
  terms: "/terms",
  privacy: "/privacy",
} as const
