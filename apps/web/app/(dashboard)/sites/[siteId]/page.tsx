import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSite } from "@/features/sites/sites.queries"

export const metadata: Metadata = {
  title: "Site · Viewtally",
}

export default async function SitePage({
  params,
}: PageProps<"/sites/[siteId]">) {
  const site = await getSite((await params).siteId)
  if (!site) notFound()

  return (
    <>
      <h1 className="text-2xl font-normal tracking-tight">{site.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">{site.domain}</p>
      <p className="mt-8 text-sm text-neutral-500">
        Analytics will appear here once your site sends its first pageview.
      </p>
    </>
  )
}
