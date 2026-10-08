import { domainSchema } from "@workspace/contracts"

/**
 * The domain someone typed on the landing page, kept for a day so
 * onboarding can fill it in after sign-in. Set by the browser, so it's
 * untrusted: only a value that passes `domainSchema` is used.
 */
export const SIGNUP_DOMAIN_COOKIE = "tusk_signup_domain"

export const SIGNUP_DOMAIN_MAX_AGE_SECONDS = 24 * 60 * 60

/** The stored domain, normalized, or undefined when missing or invalid. */
export function parseSignupDomain(
  value: string | undefined
): string | undefined {
  if (!value) return undefined
  const domain = domainSchema.safeParse(value)
  return domain.success ? domain.data : undefined
}
