import * as z from "zod"

import { siteIdSchema } from "./sites"

const MAX_URL_LENGTH = 2048

/** Event names the tracker uses itself; a goal can't take them. */
const RESERVED_EVENT_NAMES = ["pageview", "outbound"]

/**
 * A goal's name, as sent by `window.viewtally("signup")` or
 * `data-vt-goal="signup"`: lowercase letters, digits, `_` and `-`, up to
 * 64 characters. Stored as the event's name.
 */
export const goalNameSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9_-]{0,63}$/,
    "Use lowercase letters, digits, _ and -, up to 64 characters"
  )
  .refine((name) => !RESERVED_EVENT_NAMES.includes(name), {
    error: "pageview and outbound are reserved",
  })

const httpUrl = z.url({ protocol: /^https?$/ }).max(MAX_URL_LENGTH)

/** Fields every event carries. */
const eventFields = {
  siteId: siteIdSchema,
  /** The page's full URL; the server keeps the host, path and campaign parameters. */
  url: httpUrl,
  /** `document.referrer`, empty when there is none. */
  referrer: z.string().max(MAX_URL_LENGTH),
  visitorId: z.uuid(),
  sessionId: z.uuid(),
  /** True when the tracker created `sessionId` for this event. */
  newSession: z.boolean(),
}

/**
 * What the tracker posts to `POST /api/v1/collect`, as a text/plain JSON body.
 * A public contract: fields and event names can be added, never renamed or
 * removed. The tracker imports only the type, so zod stays out of its bundle.
 */
export const collectPayloadSchema = z.discriminatedUnion("name", [
  z.object({ ...eventFields, name: z.literal("pageview") }),
  /** A click on a link to another site. */
  z.object({
    ...eventFields,
    name: z.literal("outbound"),
    /** The link's URL; the server keeps its host and path only. */
    href: httpUrl,
  }),
  /** A goal the site owner tracks: a signup, a checkout, a scroll. */
  z.object({ ...eventFields, name: z.literal("goal"), goal: goalNameSchema }),
])

export type CollectPayload = z.infer<typeof collectPayloadSchema>
