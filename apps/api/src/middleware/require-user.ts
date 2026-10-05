import { createMiddleware } from "hono/factory"

import { createAuth } from "../auth/auth.config"
import type { UserEnv } from "../config/env"
import { AppError } from "../lib/errors"

/** Puts the signed-in user and session on the context; 401 otherwise. */
export const requireUser = createMiddleware<UserEnv>(async (c, next) => {
  const result = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  })
  if (!result) throw new AppError("unauthorized", "Sign in to continue")

  c.set("user", result.user)
  c.set("session", result.session)
  await next()
})
