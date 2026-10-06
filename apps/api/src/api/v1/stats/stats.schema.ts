import {
  BREAKDOWN_DEFAULT_LIMIT,
  BREAKDOWN_MAX_LIMIT,
  breakdownBySchema,
  statsIntervalSchema,
  statsPeriodSchema,
  VISITORS_DEFAULT_LIMIT,
  VISITORS_MAX_LIMIT,
} from "@workspace/contracts"
import * as z from "zod"

// Intersections rather than `.extend`: the period is a union (preset or
// custom), and each half keeps its own rules.

export const statsQuerySchema = statsPeriodSchema

export const timeseriesQuerySchema = z.intersection(
  statsPeriodSchema,
  z.object({ interval: statsIntervalSchema.optional() })
)

export const breakdownQuerySchema = z.intersection(
  statsPeriodSchema,
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
  statsPeriodSchema,
  z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(VISITORS_MAX_LIMIT)
      .default(VISITORS_DEFAULT_LIMIT),
  })
)
