import type { Site } from "@workspace/contracts"
import Link from "next/link"

import { routes } from "@/lib/routes"

type SiteSwitcherProps = { current: Site; sites: Site[] }

/** The site's name as the page heading, opening a list of the user's sites. */
export function SiteSwitcher({ current, sites }: SiteSwitcherProps) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        <h1 className="text-2xl font-normal tracking-tight">{current.name}</h1>
        <ChevronIcon />
        <span className="sr-only">Switch site</span>
      </summary>
      <div className="absolute left-0 z-10 mt-2 w-72 rounded-lg border border-border bg-background p-1 shadow-sm">
        <ul>
          {sites.map((site) => (
            <li key={site.id}>
              <Link
                href={routes.site(site.id)}
                aria-current={site.id === current.id ? "page" : undefined}
                className="block rounded-md px-3 py-2 text-sm hover:bg-muted aria-[current=page]:font-medium"
              >
                <span className="block truncate">{site.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {site.domain}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-1 border-t border-border pt-1">
          <Link
            href={routes.onboarding}
            className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
          >
            Add site
          </Link>
        </div>
      </div>
    </details>
  )
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  )
}
