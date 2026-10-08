"use server"

import {
  createSiteInputSchema,
  type CreateSiteRequest,
  type ErrorCode,
  type Site,
} from "@workspace/contracts"
import { cookies } from "next/headers"

import { createSite } from "@/features/sites/server/sites.queries"
import { SIGNUP_DOMAIN_COOKIE } from "@/lib/signup-domain"

/** Inline errors for the add-site form, by field. */
export type AddSiteErrors = {
  domain?: string
  timezone?: string
  form?: string
}

export type AddSiteResult =
  | { ok: true; site: Pick<Site, "id" | "domain"> }
  | { ok: false; errors: AddSiteErrors }

/**
 * Creates the site, or returns the errors to show. The onboarding card
 * then moves to the install step in place. Server actions are public POST
 * endpoints, so the input is validated again here even though the form
 * already did.
 */
export async function addSite(
  request: CreateSiteRequest
): Promise<AddSiteResult> {
  const input = createSiteInputSchema.safeParse(request)
  if (!input.success) {
    return {
      ok: false,
      errors: { form: "Check the domain and time zone, then try again." },
    }
  }

  const result = await createSite(input.data)
  if (!result.ok) {
    return {
      ok: false,
      errors: errorsForCode(result.error.code, result.error.message),
    }
  }

  // The landing page's domain has done its job.
  ;(await cookies()).delete(SIGNUP_DOMAIN_COOKIE)
  return { ok: true, site: { id: result.data.id, domain: result.data.domain } }
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
