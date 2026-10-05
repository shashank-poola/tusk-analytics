/**
 * Where the API Worker listens, e.g. `http://localhost:8787`. Server only:
 * the browser never calls it directly, Next.js proxies /api/* to it.
 */
export function apiOrigin(): string {
  const origin = process.env.API_ORIGIN
  if (!origin) {
    throw new Error(
      "API_ORIGIN is not set. Copy apps/web/.env.example to apps/web/.env."
    )
  }
  return origin
}
