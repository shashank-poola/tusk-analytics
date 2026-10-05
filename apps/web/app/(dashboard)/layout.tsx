import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { routes } from "@/lib/routes"
import { getSession } from "@/lib/session"

/** Every page in this group requires a signed-in user. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect(routes.signIn)

  return (
    <div className="min-h-svh bg-white text-neutral-950">
      <DashboardHeader email={session.user.email} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  )
}
