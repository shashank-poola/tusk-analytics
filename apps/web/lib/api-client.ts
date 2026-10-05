import "server-only"

import { type ErrorBody, errorBodySchema } from "@workspace/contracts"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import * as z from "zod"

import { apiOrigin } from "./env"
import { routes } from "./routes"

const TIMEOUT_MS = 10_000

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ErrorBody["error"] }

type ApiRequestOptions = { method?: "GET" | "POST"; body?: unknown }

/**
 * Calls the API Worker from server code as the signed-in user (forwarding the
 * browser's cookie, like `lib/session.ts`) and validates the response.
 *
 * API errors come back as `{ ok: false }`. A 401 means the session ended
 * mid-request, so it redirects to sign-in. Timeouts, network failures and
 * responses that don't match `schema` throw.
 */
export async function apiRequest<T extends z.ZodType>(
  path: `/api/v1/${string}`,
  schema: T,
  { method = "GET", body }: ApiRequestOptions = {}
): Promise<ApiResult<z.output<T>>> {
  const request = `${method} ${path}`
  const response = await fetch(`${apiOrigin()}${path}`, {
    method,
    headers: {
      cookie: (await headers()).get("cookie") ?? "",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (response.status === 401) redirect(routes.signIn)

  const json = await readJson(response, request)

  if (response.ok) {
    const result = schema.safeParse(json)
    if (!result.success) {
      throw new Error(
        `${request} returned an unexpected body:\n${z.prettifyError(result.error)}`
      )
    }
    return { ok: true, data: result.data }
  }

  const error = errorBodySchema.safeParse(json)
  if (!error.success) {
    throw new Error(
      `${request} failed with status ${response.status} outside the API error format. See the API (apps/api) terminal.`
    )
  }
  return { ok: false, status: response.status, error: error.data.error }
}

async function readJson(response: Response, request: string): Promise<unknown> {
  try {
    return await response.json()
  } catch (cause) {
    throw new Error(
      `${request} answered ${response.status} with a body that isn't JSON. Is API_ORIGIN pointing at the API Worker?`,
      { cause }
    )
  }
}
