import {
  BREAKDOWN_DEFAULT_LIMIT,
  BREAKDOWN_MAX_LIMIT,
  breakdownBySchema,
  statsFiltersSchema,
  statsIntervalSchema,
  statsPeriodSchema,
  VISITORS_DEFAULT_LIMIT,
  VISITORS_MAX_LIMIT,
} from "@workspace/contracts"
import * as z from "zod"

// Intersections rather than `.extend`: the period is a union (preset or
// custom), and each half keeps its own rules. Every query takes the filters.

const scopeSchema = z.intersection(statsPeriodSchema, statsFiltersSchema)

export const statsQuerySchema = scopeSchema

export const timeseriesQuerySchema = z.intersection(
  scopeSchema,
  z.object({ interval: statsIntervalSchema.optional() })
)

export const breakdownQuerySchema = z.intersection(
  scopeSchema,
  z.object({
    by: breakdownBySchema,
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(BREAKDOWN_MAX_LIMIT)
      .default(BREAKDOWN_DEFAULT_LIMIT),
  })
)

export const visitorsQuerySchema = z.intersection(
  scopeSchema,
  z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(VISITORS_MAX_LIMIT)
      .default(VISITORS_DEFAULT_LIMIT),
  })
)
