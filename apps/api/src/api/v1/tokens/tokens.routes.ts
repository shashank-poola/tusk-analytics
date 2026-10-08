import {
  type ApiTokenListResponse,
  createApiTokenInputSchema,
  type CreatedApiTokenResponse,
} from "@workspace/contracts"
import { createDb } from "@workspace/db"
import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { HTTPException } from "hono/http-exception"
import { validator } from "hono/validator"

import type { UserEnv } from "../../../config/env"
import { jsonBody, parseOrThrow } from "../../../lib/validate"
import { requireUser } from "../../../middleware/require-user"
import { MAX_CREATE_TOKEN_BODY_BYTES, tokenParamsSchema } from "./tokens.schema"
import { createApiToken, getApiTokens, revokeApiToken } from "./tokens.service"

/**
 * Mounted at /tokens: the signed-in user's account tokens. `requireUser`
 * takes the session only, so a token can't list, mint or revoke tokens.
 */
export const tokensRoutes = new Hono<UserEnv>()
  .use(requireUser)
  .get("/", async (c) => {
    const tokens = await getApiTokens(createDb(c.env.DB), c.get("user").id)
    return c.json({ tokens } satisfies ApiTokenListResponse)
  })
  .post(
    "/",
    bodyLimit({
      maxSize: MAX_CREATE_TOKEN_BODY_BYTES,
      onError: () => {
        throw new HTTPException(413, {
          message: `Request body is larger than ${MAX_CREATE_TOKEN_BODY_BYTES} bytes`,
        })
      },
    }),
    jsonBody(createApiTokenInputSchema),
    async (c) => {
      const created = await createApiToken(createDb(c.env.DB), {
        userId: c.get("user").id,
        name: c.req.valid("json").name,
      })
      return c.json(created satisfies CreatedApiTokenResponse, 201)
    }
  )
  .delete(
    "/:tokenId",
    validator("param", (value) => parseOrThrow(tokenParamsSchema, value)),
    async (c) => {
      await revokeApiToken(createDb(c.env.DB), {
        userId: c.get("user").id,
        tokenId: c.req.valid("param").tokenId,
      })
      return c.body(null, 204)
    }
  )
