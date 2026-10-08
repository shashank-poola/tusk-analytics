import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"

import type { UserEnv } from "../config/env"
import { bearerApiToken } from "../lib/api-token"
import { AppError } from "../lib/errors"
import { requireApiToken } from "../middleware/require-user"
import { JSON_RPC_ERRORS, jsonRpcMessageSchema, rpcError } from "./json-rpc"
import { handleMcpRequest } from "./mcp.server"

/** A tool call is a few short strings; anything bigger isn't a real one. */
const MAX_MCP_BODY_BYTES = 64 * 1024

/**
 * MCP clients are apps, not web pages, so they send no Origin. A page that
 * does is refused unless it is the dashboard, as the Streamable HTTP spec
 * asks (against DNS rebinding).
 */
const rejectCrossOrigin = createMiddleware<UserEnv>(async (c, next) => {
  const origin = c.req.header("origin")
  if (origin && origin !== new URL(c.env.BETTER_AUTH_URL).origin) {
    throw new AppError(
      "forbidden",
      "MCP requests from web pages aren't allowed"
    )
  }
  await next()
})

/**
 * The MCP server, mounted at /api/mcp: Streamable HTTP, stateless, JSON
 * responses only. Every request carries an account token
 * (`Authorization: Bearer tsk_…`); cookies are never read here.
 */
export const mcpRoutes = new Hono<UserEnv>()
  .post(
    "/",
    rejectCrossOrigin,
    requireApiToken,
    bodyLimit({
      maxSize: MAX_MCP_BODY_BYTES,
      onError: () => {
        throw new HTTPException(413, {
          message: `Request body is larger than ${MAX_MCP_BODY_BYTES} bytes`,
        })
      },
    }),
    async (c) => {
      const token = bearerApiToken(c.req.header("authorization"))
      if (!token) throw new Error("requireApiToken must run before /api/mcp")

      const body: unknown = await c.req.json().catch(() => undefined)
      if (body === undefined) {
        return c.json(
          rpcError(null, JSON_RPC_ERRORS.parseError, "Body is not valid JSON"),
          400
        )
      }
      const message = jsonRpcMessageSchema.safeParse(body)
      if (!message.success) {
        return c.json(
          rpcError(
            null,
            JSON_RPC_ERRORS.invalidRequest,
            "Send one JSON-RPC 2.0 request or notification per POST"
          ),
          400
        )
      }
      // Notifications (no id), such as notifications/initialized, need no answer.
      if (message.data.id === undefined) return c.body(null, 202)

      return c.json(
        await handleMcpRequest(
          { ...message.data, id: message.data.id },
          { token, env: c.env }
        )
      )
    }
  )
  // No server-sent event stream and no sessions: every answer comes back on
  // its own POST.
  .on(["GET", "DELETE"], "/", (c) => {
    c.header("Allow", "POST")
    return c.body(null, 405)
  })
