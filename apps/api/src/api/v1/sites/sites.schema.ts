import * as z from "zod"

const SITE_LIST_MAX_LIMIT = 100

export const listSitesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(SITE_LIST_MAX_LIMIT)
    .default(SITE_LIST_MAX_LIMIT),
})

// A site is a few short strings; anything bigger isn't a real request.
export const MAX_CREATE_SITE_BODY_BYTES = 4 * 1024
