"use server"

import {
  createSiteInputSchema,
  type CreateSiteRequest,
  type ErrorCode,
} from "@workspace/contracts"
import { redirect } from "next/navigation"

import { createSite } from "@/features/sites/server/sites.queries"
import { routes } from "@/lib/routes"

/** Inline errors for the add-site form, by field. */
export type AddSiteErrors = {
  domain?: string
  timezone?: string
  form?: string
}

/**
 * Creates the site and redirects to its install snippet, or returns the
 * errors to show. Server actions are public POST endpoints, so the input is
 * validated again here even though the form already did.
 */
export async function addSite(
  request: CreateSiteRequest
): Promise<AddSiteErrors> {
  const input = createSiteInputSchema.safeParse(request)
  if (!input.success) {
    return { form: "Check the domain and time zone, then try again." }
  }

  const result = await createSite(input.data)
  if (!result.ok) return errorsForCode(result.error.code, result.error.message)

  redirect(routes.installSnippet(result.data.id))
}

function errorsForCode(code: ErrorCode, message: string): AddSiteErrors {
  switch (code) {
    case "site_already_exists":
      return { domain: message }
    case "site_limit_reached":
    case "funnel_limit_reached":
    case "bad_request":
    case "unauthorized":
    case "not_found":
    case "internal_error":
      return { form: message }
  }
}
