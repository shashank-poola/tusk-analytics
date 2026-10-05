import { Hono } from "hono"

import type { AppEnv } from "../config/env"
import { createAuth } from "./auth.config"

/**
 * Better Auth handles everything under /api/auth and replies in its own JSON
 * format, which its client library expects.
 */
export const authRoutes = new Hono<AppEnv>().all("/*", (c) =>
  createAuth(c.env).handler(c.req.raw)
)
