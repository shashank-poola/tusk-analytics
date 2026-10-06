"use client"

import type { Site } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { Check, ChevronDown, Plus } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Menu, MENU_ITEM_CLASSES } from "@/components/ui/menu"
import { routes } from "@/lib/routes"

import { SiteFavicon } from "./site-favicon"

/** The current site (from the URL) and a menu to switch or add one. */
export function SiteSwitcher({ sites }: { sites: Site[] }) {
  const { siteId } = useParams<{ siteId?: string }>()
  const current = sites.find((site) => site.id === siteId)

  return (
    // Keyed so the menu closes after switching sites.
    <Menu
      key={siteId}
      label={
        current ? `Switch site, current: ${current.domain}` : "Choose a site"
      }
      trigger={
        <>
          {current && (
            <SiteFavicon siteId={current.id} domain={current.domain} />
          )}
          <span className="max-w-[9rem] truncate text-sm font-medium sm:max-w-[16rem]">
            {current?.domain ?? "Your sites"}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </>
      }
    >
      <ul>
        {sites.map((site) => (
          <li key={site.id}>
            <Link
              href={routes.site(site.id)}
              aria-current={site.id === current?.id ? "page" : undefined}
              className={MENU_ITEM_CLASSES}
            >
              <SiteFavicon siteId={site.id} domain={site.domain} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {site.domain}
                </span>
                {site.name !== site.domain && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {site.name}
                  </span>
                )}
              </span>
              <Check
                aria-hidden="true"
                className={cn(
                  "size-4 text-accent",
                  site.id !== current?.id && "invisible"
                )}
              />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 border-t border-border pt-1.5">
        <Link href={routes.onboarding} className={MENU_ITEM_CLASSES}>
          <Plus aria-hidden="true" className="size-4 text-muted-foreground" />
          Add site
        </Link>
      </div>
    </Menu>
  )
}
