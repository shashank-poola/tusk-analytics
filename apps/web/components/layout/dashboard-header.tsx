import type { Site } from "@workspace/contracts"
import Link from "next/link"

import { Logo, LogoMark } from "@/components/brand/logo"
import { SiteSwitcher } from "@/features/sites/components/site-switcher"
import { routes } from "@/lib/routes"

import { AccountMenu } from "./account-menu"
import { ThemeToggle } from "./theme-toggle"

type DashboardHeaderProps = {
  name: string | null
  email: string
  /** From `userAvatar` in lib/avatar.ts. */
  avatarSrc: string
  sites: Site[]
}

export function DashboardHeader({
  name,
  email,
  avatarSrc,
  sites,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link
          href={routes.dashboard}
          aria-label="Viewtally home"
          className="inline-flex min-h-11 items-center rounded-lg"
        >
          <Logo className="hidden sm:inline-flex" />
          <LogoMark className="size-8 sm:hidden" />
        </Link>
        {sites.length > 0 && (
          <>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <SiteSwitcher sites={sites} />
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <AccountMenu name={name} email={email} avatarSrc={avatarSrc} />
        </div>
      </div>
    </header>
  )
}
