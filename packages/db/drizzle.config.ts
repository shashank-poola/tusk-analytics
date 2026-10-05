import { readdirSync } from "node:fs"
import { join } from "node:path"

import { defineConfig } from "drizzle-kit"

// `db:studio` opens the local D1 database that `db:migrate` writes to.
// `db:studio:remote` opens the real one and needs these env vars (.env):
//   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN

const LOCAL_D1_DIR = "../../.wrangler/state/v3/d1/miniflare-D1DatabaseObject"

function localDbUrl() {
  try {
    const file = readdirSync(LOCAL_D1_DIR).find((f) => f.endsWith(".sqlite"))
    if (file) return `file:${join(LOCAL_D1_DIR, file)}`
  } catch {
    // Directory doesn't exist yet.
  }
  return undefined
}

function remoteCredentials() {
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN } =
    process.env
  if (
    !CLOUDFLARE_ACCOUNT_ID ||
    !CLOUDFLARE_DATABASE_ID ||
    !CLOUDFLARE_D1_TOKEN
  ) {
    throw new Error(
      "Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID and CLOUDFLARE_D1_TOKEN to open the remote database."
    )
  }
  return {
    accountId: CLOUDFLARE_ACCOUNT_ID,
    databaseId: CLOUDFLARE_DATABASE_ID,
    token: CLOUDFLARE_D1_TOKEN,
  }
}

const base = {
  dialect: "sqlite",
  schema: "./src/schema/index.ts",
  out: "./migrations",
} as const

const localUrl = localDbUrl()

export default process.env.DB_TARGET === "remote"
  ? defineConfig({
      ...base,
      driver: "d1-http",
      dbCredentials: remoteCredentials(),
    })
  : defineConfig({
      ...base,
      ...(localUrl && { dbCredentials: { url: localUrl } }),
    })
