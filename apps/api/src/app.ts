import { Hono } from "hono"

import { v1 } from "./api/v1"
import { authRoutes } from "./auth/auth.routes"
import { type AppEnv, assertValidEnv } from "./config/env"
import { errorHandler, notFoundHandler } from "./middleware/error-handler"
import { mcpRoutes } from "./mcp/mcp.routes"

export const app = new Hono<AppEnv>()

app.use(async (c, next) => {
  assertValidEnv(c.env)
  await next()
})

app.route("/api/auth", authRoutes)
app.route("/api/v1", v1)
app.route("/api/mcp", mcpRoutes)

app.notFound(notFoundHandler)
app.onError(errorHandler)
