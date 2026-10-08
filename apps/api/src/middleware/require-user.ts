import { createDb } from "@workspace/db"
import type { Context } from "hono"
import { createMiddleware } from "hono/factory"

import { createAuth } from "../auth/auth.config"
import type { UserEnv } from "../config/env"
import {
  bearerApiToken,
  findUserForApiToken,
  INVALID_TOKEN_MESSAGE,
} from "../lib/api-token"
import { AppError } from "../lib/errors"

async function setSessionUser(c: Context<UserEnv>): Promise<void> {
  const result = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  })
  if (!result) throw new AppError("unauthorized", "Sign in to continue")
  c.set("user", result.user)
}

async function setTokenUser(c: Context<UserEnv>, token: string): Promise<void> {
  const user = await findUserForApiToken(createDb(c.env.DB), token)
  if (!user) throw new AppError("unauthorized", INVALID_TOKEN_MESSAGE)
  c.set("user", user)
}

/** Puts the signed-in user on the context; 401 otherwise. Session only. */
export const requireUser = createMiddleware<UserEnv>(async (c, next) => {
  await setSessionUser(c)
  await next()
})

/**
 * Like `requireUser`, but also accepts an account token
 * (`Authorization: Bearer tsk_…`), as the MCP server sends. Routers opt in
 * one by one, so a new route is never readable with a token by accident.
 *
 * Account tokens are read-only: they can only make GET requests, so a
 * leaked token can read stats but never change or delete anything.
 */
export const requireUserOrToken = createMiddleware<UserEnv>(async (c, next) => {
  const token = bearerApiToken(c.req.header("authorization"))
  if (!token) {
    await setSessionUser(c)
    return next()
  }
  if (c.req.method !== "GET") {
    throw new AppError("forbidden", "Account tokens are read-only")
  }
  await setTokenUser(c, token)
  await next()
})

/**
 * An account token and nothing else, for the MCP server: cookies are never
 * read, so a browser can't drive it with the user's session. Any method,
 * since MCP speaks POST; what a token may do is decided by the routes it
 * reaches.
 */
export const requireApiToken = createMiddleware<UserEnv>(async (c, next) => {
  // Tells MCP clients that this server wants a bearer token.
  c.header("WWW-Authenticate", 'Bearer realm="Tusk"')
  const token = bearerApiToken(c.req.header("authorization"))
  if (!token) {
    throw new AppError(
      "unauthorized",
      "Send an account token: Authorization: Bearer tsk_…. Create one in Tusk under Settings → API & MCP."
    )
  }
  await setTokenUser(c, token)
  await next()
})
