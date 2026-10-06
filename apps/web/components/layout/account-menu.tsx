"use client"

import { LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { routes } from "@/lib/routes"

import { Avatar } from "@/components/ui/avatar"
import { Menu } from "@/components/ui/menu"
import { MENU_ITEM_CLASSES } from "@/components/ui/menu-styles"

type AccountMenuProps = {
  name: string | null
  email: string
  /** From `userAvatar` in lib/avatar.ts. */
  avatarSrc: string
}

/** The signed-in person's photo, with a menu for settings and signing out. */
export function AccountMenu({ name, email, avatarSrc }: AccountMenuProps) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const display = name?.trim() || email

  async function signOut() {
    setSigningOut(true)
    await authClient.signOut()
    router.replace(routes.signIn)
  }

  return (
    <Menu
      align="end"
      label={`Account: ${display}`}
      triggerClassName="rounded-full p-0.5 ring-1 ring-transparent transition-shadow hover:bg-transparent hover:ring-border group-open:ring-border sm:min-h-0"
      panelClassName="w-64"
      trigger={<Avatar src={avatarSrc} />}
    >
      <div className="flex items-center gap-3 px-2.5 py-2.5">
        <Avatar src={avatarSrc} className="size-9" />
        <div className="min-w-0">
          {name?.trim() && (
            <p className="truncate text-sm font-semibold">{name}</p>
          )}
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <div className="mt-1 border-t border-border pt-1">
        <Link href={routes.settings} className={MENU_ITEM_CLASSES}>
          <Settings
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          Settings
        </Link>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className={`${MENU_ITEM_CLASSES} disabled:opacity-60`}
        >
          <LogOut aria-hidden="true" className="size-4 text-muted-foreground" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </Menu>
  )
}
