"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

import { useSetView } from "@/features/analytics/hooks/use-set-view"

type ViewLinkProps = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & {
  /** From `routes.site(id, search)`. */
  href: string
}

/**
 * A link that sets the dashboard's view. A plain click stores the view in
 * the site's cookie through a server action, so the URL stays clean; the
 * href still works for "open in a new tab" and without JavaScript (the
 * proxy turns it into the same cookie). It never prefetches: a prefetch
 * must not change anyone's view.
 */
export function ViewLink({ href, onClick, ...props }: ViewLinkProps) {
  const { setView, pending } = useSetView()
  return (
    <Link
      href={href}
      prefetch={false}
      aria-busy={pending || undefined}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        const plainClick =
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        if (!plainClick) return
        event.preventDefault()
        setView(href)
      }}
      {...props}
    />
  )
}
