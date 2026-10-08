import {
  createSiteInputSchema,
  type InstallStatus,
  type SiteListResponse,
  type SiteResponse,
} from "@workspace/contracts"
import { createDb } from "@workspace/db"
import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { HTTPException } from "hono/http-exception"

import type { UserEnv } from "../../../config/env"
import { jsonBody, queryParams } from "../../../lib/validate"
import { requireSite } from "../../../middleware/require-site"
import { requireUserOrToken } from "../../../middleware/require-user"
import {
  listSitesQuerySchema,
  MAX_CREATE_SITE_BODY_BYTES,
} from "./sites.schema"
import { faviconHeaders } from "./favicon-response"
import { getSiteFavicon } from "./site-favicon"
import {
  createSite,
  getInstallStatus,
  listSites,
  toSite,
} from "./sites.service"

export const sitesRoutes = new Hono<UserEnv>()
  .use(requireUserOrToken)
  .get("/", queryParams(listSitesQuerySchema), async (c) => {
    const sites = await listSites(createDb(c.env.DB), {
      ownerId: c.get("user").id,
      limit: c.req.valid("query").limit,
    })
    return c.json({ sites } satisfies SiteListResponse)
  })
  .post(
    "/",
    bodyLimit({
      maxSize: MAX_CREATE_SITE_BODY_BYTES,
      onError: () => {
        throw new HTTPException(413, {
          message: `Request body is larger than ${MAX_CREATE_SITE_BODY_BYTES} bytes`,
        })
      },
    }),
    jsonBody(createSiteInputSchema),
    async (c) => {
      const site = await createSite(createDb(c.env.DB), {
        ownerId: c.get("user").id,
        input: c.req.valid("json"),
        allowLocalhost: c.env.ENVIRONMENT === "development",
      })
      return c.json({ site } satisfies SiteResponse, 201)
    }
  )
  // requireSite answers 404 unless the signed-in user owns :siteId.
  .get("/:siteId", requireSite, (c) =>
    c.json({ site: toSite(c.get("site")) } satisfies SiteResponse)
  )
  .get("/:siteId/install-status", requireSite, async (c) => {
    const status = await getInstallStatus(createDb(c.env.DB), c.get("site").id)
    return c.json(status satisfies InstallStatus)
  })
  // Loaded by the dashboard as <img src>, so it answers with the image bytes.
  .get("/:siteId/favicon", requireSite, async (c) => {
    const favicon = await getSiteFavicon(c.get("site"), (promise) =>
      c.executionCtx.waitUntil(promise)
    )
    return c.body(favicon.bytes, 200, faviconHeaders(favicon.contentType))
  })
