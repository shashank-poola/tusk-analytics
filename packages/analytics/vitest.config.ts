import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    // Not localhost: the tracker skips localhost pages unless told otherwise.
    environmentOptions: { jsdom: { url: "https://example.com/" } },
  },
})
