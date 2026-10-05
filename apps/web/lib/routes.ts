export const routes = {
  signIn: "/signup",
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  installSnippet: (siteId: string) => `/onboarding/${siteId}`,
  site: (siteId: string) => `/sites/${siteId}`,
  terms: "/terms",
  privacy: "/privacy",
} as const
