import type { ErrorBody, ErrorCode } from "@workspace/contracts"
import type { ContentfulStatusCode } from "hono/utils/http-status"

const STATUS_BY_CODE = {
  bad_request: 400,
  unauthorized: 401,
  not_found: 404,
  site_already_exists: 409,
  site_limit_reached: 409,
  funnel_limit_reached: 409,
  internal_error: 500,
} as const satisfies Record<ErrorCode, ContentfulStatusCode>

/**
 * An error that is safe to show to the client. Throw it from routes, services
 * or middleware; the error handler turns it into an `ErrorBody` response.
 *
 * @example
 * throw new AppError("not_found", "Site not found")
 */
export class AppError extends Error {
  readonly status: ContentfulStatusCode

  constructor(
    readonly code: ErrorCode,
    message: string
  ) {
    super(message)
    this.name = "AppError"
    this.status = STATUS_BY_CODE[code]
  }
}

export function toErrorBody(code: ErrorCode, message: string): ErrorBody {
  return { error: { code, message } }
}

/** For errors that only carry an HTTP status, such as Hono's HTTPException. */
export function codeForStatus(status: number): ErrorCode {
  if (status === 401) return "unauthorized"
  if (status === 404) return "not_found"
  return status < 500 ? "bad_request" : "internal_error"
}
