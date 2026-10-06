"use client"

import type { Site } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { Check, ChevronDown, Code, LayoutGrid, Plus } from "lucide-react"
import Link from "next/link"

import { Menu } from "@/components/ui/menu"
import { MENU_ITEM_CLASSES } from "@/components/ui/menu-styles"
import { routes } from "@/lib/routes"

import { SiteFavicon } from "./site-favicon"

type SiteSwitcherProps = {
  /** The site on screen. */
  current: Site
  /** Every site of the signed-in user, newest first. */
  sites: Site[]
  /** Classes for the chip, so it matches the row it sits in. */
  chipClassName?: string
}

/** The current site as a chip, with a menu to switch, add a site or get the snippet. */
export function SiteSwitcher({
  current,
  sites,
  chipClassName,
}: SiteSwitcherProps) {
  return (
    // Keyed so the menu closes after switching sites.
    <Menu
      key={current.id}
      label={`Switch site, current: ${current.domain}`}
      triggerClassName="rounded-lg px-0 hover:bg-transparent"
      trigger={
        <span className={chipClassName}>
          <SiteFavicon siteId={current.id} domain={current.domain} />
          <span className="max-w-[9rem] truncate sm:max-w-[16rem]">
            {current.domain}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </span>
      }
    >
      <ul>
        {sites.map((site) => (
          <li key={site.id}>
            <Link
              href={routes.site(site.id)}
              aria-current={site.id === current.id ? "page" : undefined}
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
                  site.id !== current.id && "invisible"
                )}
              />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 border-t border-border pt-1.5">
        <Link href={routes.sites} className={MENU_ITEM_CLASSES}>
          <LayoutGrid
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          All sites
        </Link>
        <Link
          href={routes.installSnippet(current.id)}
          className={MENU_ITEM_CLASSES}
        >
          <Code aria-hidden="true" className="size-4 text-muted-foreground" />
          Tracking code
        </Link>
        <Link href={routes.onboarding} className={MENU_ITEM_CLASSES}>
          <Plus aria-hidden="true" className="size-4 text-muted-foreground" />
          Add site
        </Link>
      </div>
    </Menu>
  )
}
