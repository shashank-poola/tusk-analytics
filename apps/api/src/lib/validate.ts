import { validator } from "hono/validator"
import type * as z from "zod"

import { AppError } from "./errors"

/** Parses `value` with `schema`, or throws a 400 `AppError` naming the field. */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  value: unknown
): z.output<T> {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  const issue = result.error.issues[0]
  const field = issue?.path.join(".") || "body"
  throw new AppError("bad_request", `${field}: ${issue?.message ?? "invalid"}`)
}

/** Validates the JSON body; read it in the handler with `c.req.valid("json")`. */
export const jsonBody = <T extends z.ZodType>(schema: T) =>
  validator("json", (value) => parseOrThrow(schema, value))

/** Validates the query string; read it with `c.req.valid("query")`. */
export const queryParams = <T extends z.ZodType>(schema: T) =>
  validator("query", (value) => parseOrThrow(schema, value))
