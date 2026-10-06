"use server"

import { siteIdSchema } from "@workspace/contracts"
import { cookies } from "next/headers"

import {
  parseView,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import {
  MAX_VIEW_COOKIE_LENGTH,
  VIEW_COOKIE,
  VIEW_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/view-cookie"

/**
 * Keeps a site's dashboard view (period, filters, tabs…) in its cookie. A
 * server action that sets a cookie makes Next re-render the page with it,
 * so the view changes without the URL changing. The view is only a
 * preference: it is parsed and rewritten in its canonical form here, and
 * validated again when the page reads it.
 */
export async function setViewAction(
  siteId: string,
  search: Record<string, string>
): Promise<void> {
  const site = siteIdSchema.safeParse(siteId)
  if (!site.success) return
  const stored = new URLSearchParams(viewSearch(parseView(search))).toString()
  if (stored.length > MAX_VIEW_COOKIE_LENGTH) return

  ;(await cookies()).set({
    name: VIEW_COOKIE,
    value: stored,
    // Only this site's pages get it, so each site keeps its own view.
    path: `/site/${site.data}`,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VIEW_COOKIE_MAX_AGE_SECONDS,
  })
}
