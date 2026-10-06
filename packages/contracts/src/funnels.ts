import * as z from "zod"

import { goalNameSchema } from "./ingest"

export const FUNNEL_MIN_STEPS = 2
export const FUNNEL_MAX_STEPS = 8
/** Funnels per site. */
export const FUNNEL_MAX_PER_SITE = 20

/** Public funnel id from `createId("fn")` in `@workspace/db`. */
export const funnelIdSchema = z
  .string()
  .regex(/^fn_[0-9a-z]{16}$/, "Not a valid funnel id")

/** A visitor reaches a step by viewing a page or completing a goal. */
export const funnelStepSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("page"),
    /** An exact path, `/pricing`. */
    value: z
      .string()
      .trim()
      .regex(/^\/\S*$/, "A page path starts with /, like /pricing")
      .max(1024),
  }),
  z.object({ type: z.literal("goal"), value: goalNameSchema }),
])
export type FunnelStep = z.infer<typeof funnelStepSchema>

export const createFunnelInputSchema = z.object({
  name: z.string().trim().min(1, "Name the funnel").max(80),
  steps: z
    .array(funnelStepSchema)
    .min(FUNNEL_MIN_STEPS, `A funnel needs at least ${FUNNEL_MIN_STEPS} steps`)
    .max(FUNNEL_MAX_STEPS, `A funnel has at most ${FUNNEL_MAX_STEPS} steps`),
})
export type CreateFunnelInput = z.infer<typeof createFunnelInputSchema>

export const funnelSchema = createFunnelInputSchema.extend({
  id: funnelIdSchema,
  createdAt: z.iso.datetime(),
})
export type Funnel = z.infer<typeof funnelSchema>

export const funnelResponseSchema = z.object({ funnel: funnelSchema })
export type FunnelResponse = z.infer<typeof funnelResponseSchema>

/** Oldest first, at most FUNNEL_MAX_PER_SITE. */
export const funnelListResponseSchema = z.object({
  funnels: z.array(funnelSchema),
})
export type FunnelListResponse = z.infer<typeof funnelListResponseSchema>
