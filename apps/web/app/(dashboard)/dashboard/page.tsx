import { redirect } from "next/navigation"

import { listSites } from "@/features/sites/sites.queries"
import { routes } from "@/lib/routes"

/** Sends people to their newest site, or to onboarding if they have none. */
export default async function DashboardPage() {
  const [latest] = await listSites({ limit: 1 })
  redirect(latest ? routes.site(latest.id) : routes.onboarding)
}
