import Link from "next/link"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { Logo } from "@/components/brand/logo"
import { routes } from "@/lib/routes"

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href={routes.dashboard}>
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-neutral-500 sm:inline">
            {email}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
