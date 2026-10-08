import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthShowcase } from "@/features/auth/components/auth-showcase"
import { SignIn } from "@/features/auth/components/sign-in"
import { routes } from "@/lib/routes"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Sign in",
}

export default async function SignUpPage({
  searchParams,
}: PageProps<"/signup">) {
  if (await getSession()) redirect(routes.dashboard)

  const { error } = await searchParams

  return (
    <div className="flex min-h-svh">
      <AuthShowcase />
      <main className="dark flex flex-1 items-center justify-center bg-background px-6 py-12 text-foreground">
        <SignIn errorCode={typeof error === "string" ? error : undefined} />
      </main>
    </div>
  )
}
