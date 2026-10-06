import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/layout/dashboard-header"
import { userAvatar } from "@/lib/avatar"
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
    <div className="min-h-svh">
      <DashboardHeader
        name={session.user.name || null}
        email={session.user.email}
        avatarSrc={userAvatar(session.user)}
      />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  )
}
