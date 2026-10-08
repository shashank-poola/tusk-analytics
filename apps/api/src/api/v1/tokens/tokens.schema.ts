import { apiTokenIdSchema } from "@workspace/contracts"
import * as z from "zod"

// The body schema is `createApiTokenInputSchema` in @workspace/contracts:
// the Settings form validates with it too.

/** A name of up to 60 characters: well under this. */
export const MAX_CREATE_TOKEN_BODY_BYTES = 1024

export const tokenParamsSchema = z.object({ tokenId: apiTokenIdSchema })
