import * as z from "zod"

const DEV_SCRIPT_URL = "http://localhost:8787/script.js"

const url = z.url({ error: "missing or not a valid URL" })

function readVariable(name: string, schema: z.ZodType<string>): string {
  const result = schema.safeParse(process.env[name])
  if (!result.success) {
    throw new Error(
      `${name} is ${result.error.issues[0]?.message ?? "invalid"}. Copy apps/web/.env.example to apps/web/.env and set it.`
    )
  }
  return result.data
}

/**
 * Where the API Worker listens, e.g. `http://localhost:8787`. Server only:
 * the browser never calls it directly, Next.js proxies /api/* to it.
 * `next.config.ts` reads it, so a bad value fails at startup.
 */
export function apiOrigin(): string {
  return readVariable("API_ORIGIN", url)
}

/**
 * The tracker script customers paste into their sites. `next.config.ts`
 * checks it when `next start` boots; builds and `next typegen` don't need it.
 */
export function scriptUrl(): string {
  return readVariable(
    "NEXT_PUBLIC_SCRIPT_URL",
    process.env.NODE_ENV === "production" ? url : url.default(DEV_SCRIPT_URL)
  )
}
