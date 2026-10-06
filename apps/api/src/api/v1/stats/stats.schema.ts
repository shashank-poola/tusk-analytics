import {
  BREAKDOWN_DEFAULT_LIMIT,
  BREAKDOWN_MAX_LIMIT,
  breakdownBySchema,
  statsRangeSchema,
  VISITORS_DEFAULT_LIMIT,
  VISITORS_MAX_LIMIT,
} from "@workspace/contracts"
import * as z from "zod"

export const statsQuerySchema = z.object({ range: statsRangeSchema })

export const breakdownQuerySchema = statsQuerySchema.extend({
  by: breakdownBySchema,
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(BREAKDOWN_MAX_LIMIT)
    .default(BREAKDOWN_DEFAULT_LIMIT),
})

export const visitorsQuerySchema = statsQuerySchema.extend({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(VISITORS_MAX_LIMIT)
    .default(VISITORS_DEFAULT_LIMIT),
})
