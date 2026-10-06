/**
 * Serves test-page/index.html on http://localhost:4000 for every path, so
 * full page loads and SPA navigations can be tried by hand against the local
 * API (`bun run dev`). Run with `bun run tracker:dev` from the repo root.
 */
const PORT = 4000
const page = Bun.file(`${import.meta.dir}/index.html`)

Bun.serve({
  port: PORT,
  hostname: "localhost",
  fetch: () => new Response(page, { headers: { "Content-Type": "text/html" } }),
})

console.log(
  `Tracker test page: http://localhost:${PORT}/?site=<your localhost site id>`
)
