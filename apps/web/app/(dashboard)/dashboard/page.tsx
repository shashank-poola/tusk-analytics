import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { routes } from "@/lib/routes"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Dashboard · Viewtally",
}

export default async function DashboardPage() {
  // The layout already checked this; the call is cached for the request.
  const session = await getSession()
  if (!session) redirect(routes.signIn)

  return (
    <>
      <h1 className="text-2xl font-normal tracking-tight">
        Welcome, {session.user.name || session.user.email}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Your sites and their traffic will show up here.
      </p>
    </>
  )
}
