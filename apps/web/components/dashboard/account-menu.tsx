"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { routes } from "@/lib/routes"

import { Menu, MENU_ITEM_CLASSES } from "./menu"

type AccountMenuProps = { name: string | null; email: string }

/** The signed-in person, as an initial, with a menu to sign out. */
export function AccountMenu({ name, email }: AccountMenuProps) {
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
      trigger={
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent uppercase"
        >
          {display[0]}
        </span>
      }
    >
      <div className="px-3 py-2">
        {name?.trim() && <p className="truncate text-sm font-medium">{name}</p>}
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <div className="mt-1 border-t border-border pt-1.5">
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
