import * as z from "zod"

import { siteIdSchema } from "./sites"

const MAX_URL_LENGTH = 2048

/**
 * What the tracker posts to `POST /api/v1/collect`, as a text/plain JSON body.
 * A public contract: fields can be added, never renamed or removed. The
 * tracker imports only the type, so zod stays out of its bundle.
 */
export const collectPayloadSchema = z.object({
  siteId: siteIdSchema,
  name: z.literal("pageview"),
  /** The page's full URL; the server keeps the path and the UTM parameters. */
  url: z.url({ protocol: /^https?$/ }).max(MAX_URL_LENGTH),
  /** `document.referrer`, empty when there is none. */
  referrer: z.string().max(MAX_URL_LENGTH),
  visitorId: z.uuid(),
  sessionId: z.uuid(),
  /** True when the tracker created `sessionId` for this event. */
  newSession: z.boolean(),
})

export type CollectPayload = z.infer<typeof collectPayloadSchema>
