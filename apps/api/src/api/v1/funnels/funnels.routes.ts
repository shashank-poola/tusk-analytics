import {
  createFunnelInputSchema,
  type FunnelListResponse,
  type FunnelResponse,
} from "@workspace/contracts"
import { createDb } from "@workspace/db"
import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { HTTPException } from "hono/http-exception"
import { validator } from "hono/validator"

import type { SiteEnv } from "../../../config/env"
import { jsonBody, parseOrThrow } from "../../../lib/validate"
import { requireSite } from "../../../middleware/require-site"
import { requireUserOrToken } from "../../../middleware/require-user"
import {
  funnelParamsSchema,
  MAX_CREATE_FUNNEL_BODY_BYTES,
} from "./funnels.schema"
import { createFunnel, getFunnels, removeFunnel } from "./funnels.service"

/**
 * Mounted at /sites/:siteId/funnels. requireSite answers 404 unless the
 * signed-in user owns :siteId; every query is scoped to that site.
 */
export const funnelsRoutes = new Hono<SiteEnv>()
  .use(requireUserOrToken)
  .use(requireSite)
  .get("/", async (c) => {
    const funnels = await getFunnels(createDb(c.env.DB), c.get("site").id)
    return c.json({ funnels } satisfies FunnelListResponse)
  })
  .post(
    "/",
    bodyLimit({
      maxSize: MAX_CREATE_FUNNEL_BODY_BYTES,
      onError: () => {
        throw new HTTPException(413, {
          message: `Request body is larger than ${MAX_CREATE_FUNNEL_BODY_BYTES} bytes`,
        })
      },
    }),
    jsonBody(createFunnelInputSchema),
    async (c) => {
      const funnel = await createFunnel(createDb(c.env.DB), {
        siteId: c.get("site").id,
        input: c.req.valid("json"),
      })
      return c.json({ funnel } satisfies FunnelResponse, 201)
    }
  )
  .delete(
    "/:funnelId",
    validator("param", (value) => parseOrThrow(funnelParamsSchema, value)),
    async (c) => {
      await removeFunnel(createDb(c.env.DB), {
        siteId: c.get("site").id,
        funnelId: c.req.valid("param").funnelId,
      })
      return c.body(null, 204)
    }
  )
