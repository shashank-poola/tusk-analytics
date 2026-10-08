import { redirect } from "next/navigation"

import {
  findInstallStatus,
  listSites,
} from "@/features/sites/server/sites.queries"
import { routes } from "@/lib/routes"

/**
 * Where sign-in lands, and where onboarding resumes from on any device:
 * no site yet means adding one; a newest site that has never had a visit
 * means installing its script; otherwise its dashboard. Worked out from
 * the data, so nothing about onboarding has to be stored. When the API
 * can't say, the site's page decides: it shows the dashboard or the
 * waiting banner, both with a way to the snippet.
 */
export default async function DashboardPage() {
  const [latest] = await listSites({ limit: 1 })
  if (!latest) redirect(routes.onboarding)
  const status = await findInstallStatus(latest.id)
  redirect(
    status?.connected === false
      ? routes.installSnippet(latest.id)
      : routes.site(latest.id)
  )
}
