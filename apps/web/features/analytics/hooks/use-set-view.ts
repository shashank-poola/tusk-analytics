"use client"

import { useCallback, useTransition } from "react"

import { setViewAction } from "@/features/analytics/server/view-actions"
import { VIEW_PARAM } from "@/lib/routes"

/**
 * Sets the dashboard view from a link made with `routes.site(id, search)`,
 * without changing the URL: the server action stores it in the site's
 * cookie and the page re-renders. `pending` is true while that happens.
 */
export function useSetView() {
  const [pending, startTransition] = useTransition()
  const setView = useCallback((href: string) => {
    const url = new URL(href, window.location.origin)
    const siteId = url.pathname.split("/")[2] ?? ""
    const search = Object.fromEntries(url.searchParams)
    delete search[VIEW_PARAM]
    startTransition(async () => {
      await setViewAction(siteId, search)
    })
  }, [])
  return { setView, pending }
}
