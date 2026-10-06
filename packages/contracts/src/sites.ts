import * as z from "zod"

/** Public site id from `createId("vt")` in `@workspace/db`. */
export const siteIdSchema = z
  .string()
  .regex(/^vt_[0-9a-z]{16}$/, "Not a valid site id")

/** Accepted as a domain only outside production, for local testing. */
export const LOCALHOST = "localhost"

// People paste full URLs, so the raw input can be longer than a hostname.
const MAX_DOMAIN_INPUT_LENGTH = 2048
const MAX_HOSTNAME_LENGTH = 253
const HOSTNAME_LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/

/**
 * Reduces what people paste ("https://www.MyApp.com:8080/pricing?x=1") to the
 * bare hostname we store ("myapp.com"). `domainSchema` validates the result.
 */
function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^(?:[a-z][a-z0-9+.-]*:)?\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d*$/, "")
    .replace(/^www\./, "")
}

function isIpAddress(host: string): boolean {
  // IPv6 survives normalization with its colons or brackets.
  return /^\d+(?:\.\d+){3}$/.test(host) || /[:[\]]/.test(host)
}

function isHostname(host: string): boolean {
  if (host.length > MAX_HOSTNAME_LENGTH) return false

  const labels = host.split(".")
  const topLevel = labels[labels.length - 1] ?? ""
  return (
    labels.length >= 2 &&
    labels.every((label) => HOSTNAME_LABEL.test(label)) &&
    !/^\d+$/.test(topLevel)
  )
}

export const domainSchema = z
  .string()
  .max(MAX_DOMAIN_INPUT_LENGTH, "Enter a domain like myapp.com")
  .transform(normalizeDomain)
  .refine((host) => !isIpAddress(host), {
    error: "Use your site's domain, not an IP address",
    abort: true,
  })
  .refine((host) => host === LOCALHOST || isHostname(host), {
    error: "Enter a domain like myapp.com",
  })

function isIanaTimeZone(value: string): boolean {
  // Intl also accepts UTC offsets like "+05:30", which aren't IANA names.
  if (!/^[A-Za-z][A-Za-z0-9_+\-/]*$/.test(value)) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return true
  } catch (error) {
    if (error instanceof RangeError) return false
    throw error
  }
}

export const timezoneSchema = z
  .string()
  .trim()
  .max(64)
  .refine(isIanaTimeZone, "Choose a time zone like Europe/Berlin")

export const createSiteInputSchema = z
  .object({
    domain: domainSchema,
    timezone: timezoneSchema,
    name: z.string().trim().min(1).max(100).optional(),
  })
  .transform(({ name, ...site }) => ({ ...site, name: name ?? site.domain }))

/** What the form sends. */
export type CreateSiteRequest = z.input<typeof createSiteInputSchema>
/** What the API works with after validation: normalized, with a name. */
export type CreateSiteInput = z.output<typeof createSiteInputSchema>

export const siteSchema = z.object({
  id: siteIdSchema,
  name: z.string(),
  domain: z.string(),
  timezone: z.string(),
  createdAt: z.iso.datetime(),
})

export type Site = z.infer<typeof siteSchema>

export const siteResponseSchema = z.object({ site: siteSchema })
/** Most sites one list request returns (an account holds at most 25). */
export const SITE_LIST_MAX_LIMIT = 100

export const siteListResponseSchema = z.object({ sites: z.array(siteSchema) })

export type SiteResponse = z.infer<typeof siteResponseSchema>
export type SiteListResponse = z.infer<typeof siteListResponseSchema>

/** Whether the site's tracker has sent anything yet. */
export const installStatusSchema = z.discriminatedUnion("connected", [
  z.object({ connected: z.literal(false), firstEventAt: z.null() }),
  z.object({ connected: z.literal(true), firstEventAt: z.iso.datetime() }),
])

export type InstallStatus = z.infer<typeof installStatusSchema>
