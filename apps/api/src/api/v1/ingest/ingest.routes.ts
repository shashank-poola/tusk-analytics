import { collectPayloadSchema } from "@workspace/contracts"
import { createDb } from "@workspace/db"
import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { HTTPException } from "hono/http-exception"

import type { AppEnv } from "../../../config/env"
import { AppError } from "../../../lib/errors"
import { parseOrThrow } from "../../../lib/validate"
import { corsPublic } from "../../../middleware/cors-public"
import { MAX_COLLECT_BODY_BYTES } from "./ingest.schema"
import { ingestEvent } from "./ingest.service"

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new AppError("bad_request", "Body must be JSON")
  }
}

/**
 * Public: the tracker posts here from customer sites, so there is no session
 * and no requireUser/requireSite. Mounted at /collect, so corsPublic applies
 * to this route only.
 */
export const ingestRoutes = new Hono<AppEnv>().use(corsPublic).post(
  "/",
  bodyLimit({
    maxSize: MAX_COLLECT_BODY_BYTES,
    onError: () => {
      throw new HTTPException(413, {
        message: `Request body is larger than ${MAX_COLLECT_BODY_BYTES} bytes`,
      })
    },
  }),
  async (c) => {
    // The tracker sends text/plain to avoid a CORS preflight, so the JSON
    // validator (which wants application/json) doesn't apply.
    const payload = parseOrThrow(
      collectPayloadSchema,
      parseJson(await c.req.text())
    )

    const result = await ingestEvent(createDb(c.env.DB), {
      payload,
      origin: c.req.header("Origin"),
      userAgent: c.req.header("User-Agent"),
      country: c.req.raw.cf?.country,
      region: c.req.raw.cf?.region,
      city: c.req.raw.cf?.city,
      now: new Date(),
    })

    // A well-formed event for an unknown site, from the wrong or no origin,
    // or from a bot gets the same 202 as a recorded one. A distinct status
    // would tell anyone probing which site ids exist and which domains they
    // belong to, and would print errors in customers' consoles for traffic
    // they can't control (bots, preview deploys, copied snippets). Only
    // malformed bodies get a 4xx, because those are bugs worth seeing.
    if (result.status === "dropped") {
      console.log({
        message: "collect: event dropped",
        reason: result.reason,
        siteId: payload.siteId,
        rayId: c.req.header("cf-ray"),
      })
    }
    return c.body(null, 202)
  }
)
