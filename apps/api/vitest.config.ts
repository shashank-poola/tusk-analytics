import { fileURLToPath } from "node:url"

import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin"
import { defineConfig } from "vitest/config"

const migrationsDir = fileURLToPath(
  new URL("../../packages/db/migrations", import.meta.url)
)

// Tests run inside workerd against an in-memory D1, never a real database.
export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        // Fixed values so tests don't depend on .dev.vars.
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations(migrationsDir),
          BETTER_AUTH_URL: "http://localhost:3000",
          BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
          GOOGLE_CLIENT_ID: "test-google-client-id",
          GOOGLE_CLIENT_SECRET: "test-google-client-secret",
          RESEND_API_KEY: "re_test",
          EMAIL_FROM: "Viewtally <login@example.com>",
        },
      },
    })),
  ],
  test: {
    setupFiles: ["./test/apply-migrations.ts"],
  },
})
