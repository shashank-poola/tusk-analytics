import * as z from "zod"

/** Every account token starts with this, so it's easy to spot in a config. */
export const API_TOKEN_PREFIX = "tsk_"
export const API_TOKEN_NAME_MAX_LENGTH = 60
export const MAX_API_TOKENS_PER_USER = 10

export const createApiTokenInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the token a name, like Claude Code")
    .max(
      API_TOKEN_NAME_MAX_LENGTH,
      `Use at most ${API_TOKEN_NAME_MAX_LENGTH} characters`
    ),
})
export type CreateApiTokenInput = z.infer<typeof createApiTokenInputSchema>

/** A token as Settings lists it: never the secret or its hash. */
export const apiTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** The first characters of the secret, e.g. `tsk_3k9x2m7q`. */
  prefix: z.string(),
  lastUsedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})
export type ApiToken = z.infer<typeof apiTokenSchema>

export const apiTokenListResponseSchema = z.object({
  tokens: z.array(apiTokenSchema),
})
export type ApiTokenListResponse = z.infer<typeof apiTokenListResponseSchema>

/** The only response that ever carries the secret: right after creating it. */
export const createdApiTokenResponseSchema = z.object({
  token: apiTokenSchema,
  secret: z.string().startsWith(API_TOKEN_PREFIX),
})
export type CreatedApiTokenResponse = z.infer<
  typeof createdApiTokenResponseSchema
>

export const apiTokenIdSchema = z
  .string()
  .regex(/^tok_[0-9a-z]{16}$/, "Not a valid token id")
