import type { ErrorHandler, NotFoundHandler } from "hono"
import { HTTPException } from "hono/http-exception"

import { AppError, codeForStatus, toErrorBody } from "../lib/errors"

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json(toErrorBody(err.code, err.message), err.status)
  }

  // Thrown by Hono itself, e.g. for a malformed request body.
  if (err instanceof HTTPException && err.status < 500) {
    return c.json(
      toErrorBody(codeForStatus(err.status), err.message || "Bad request"),
      err.status
    )
  }

  // Anything else is a bug. Log it, and don't leak details to the client.
  console.error(err)
  return c.json(toErrorBody("internal_error", "Something went wrong"), 500)
}

export const notFoundHandler: NotFoundHandler = (c) =>
  c.json(toErrorBody("not_found", "Not found"), 404)
