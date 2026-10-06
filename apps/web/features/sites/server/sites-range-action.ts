"use server"

import { cookies } from "next/headers"

import { routes } from "@/lib/routes"
import {
  SITES_RANGE_COOKIE,
  VIEW_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/view-cookie"

import { parseSitesRange } from "@/features/sites/utils/sites-range"

/**
 * Keeps the /sites period in a cookie, so the URL stays clean; setting it
 * makes Next re-render the page. Anything unknown becomes the default.
 */
export async function setSitesRangeAction(range: string): Promise<void> {
  ;(await cookies()).set({
    name: SITES_RANGE_COOKIE,
    value: parseSitesRange(range),
    path: routes.sites,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VIEW_COOKIE_MAX_AGE_SECONDS,
  })
}
