import { type NextRequest, NextResponse } from "next/server"

import { VIEW_PARAM } from "@/lib/routes"
import {
  MAX_VIEW_COOKIE_LENGTH,
  VIEW_COOKIE,
  VIEW_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/view-cookie"

/**
 * A dashboard link carries its view in the query (`?view=1&range=30d`).
 * Keep that in a cookie for this site and redirect to the clean URL, as
 * DataFast does. The page validates the cookie again; it is only a
 * preference, never trusted.
 */
export function proxy(request: NextRequest) {
  const { nextUrl } = request
  if (!nextUrl.searchParams.has(VIEW_PARAM)) return NextResponse.next()
  // Prefetching must never change the view; render with the query as is.
  if (request.headers.has("next-router-prefetch")) return NextResponse.next()

  const view = new URLSearchParams(nextUrl.searchParams)
  view.delete(VIEW_PARAM)
  const stored = view.toString()
  // Too big for a cookie (long filter values): keep it in the URL.
  if (stored.length > MAX_VIEW_COOKIE_LENGTH) return NextResponse.next()

  const clean = nextUrl.clone()
  clean.search = ""
  const response = NextResponse.redirect(clean)
  response.cookies.set({
    name: VIEW_COOKIE,
    value: stored,
    // Only this site's pages get it, so each site keeps its own view.
    path: clean.pathname,
    httpOnly: true,
    sameSite: "lax",
    secure: clean.protocol === "https:",
    maxAge: VIEW_COOKIE_MAX_AGE_SECONDS,
  })
  return response
}

export const config = { matcher: "/site/:siteId" }
