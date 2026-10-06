import * as z from "zod"

const errorCodeSchema = z.enum([
  "bad_request",
  "unauthorized",
  "not_found",
  "site_already_exists",
  "site_limit_reached",
  "funnel_limit_reached",
  "internal_error",
])

export type ErrorCode = z.infer<typeof errorCodeSchema>

/** Every error the API returns (outside /api/auth) has this shape. */
export const errorBodySchema = z.object({
  error: z.object({ code: errorCodeSchema, message: z.string() }),
})

export type ErrorBody = z.infer<typeof errorBodySchema>
