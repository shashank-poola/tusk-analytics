import { funnelIdSchema } from "@workspace/contracts"
import * as z from "zod"

// The body schema is `createFunnelInputSchema` in @workspace/contracts: the
// dashboard's form validates with it too.

/** Eight steps of up to 1 KB each, plus the name: well under this. */
export const MAX_CREATE_FUNNEL_BODY_BYTES = 16 * 1024

export const funnelParamsSchema = z.object({ funnelId: funnelIdSchema })
