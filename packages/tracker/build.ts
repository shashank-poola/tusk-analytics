/**
 * Bundles src/index.ts into one minified IIFE at apps/api/public/script.js,
 * which the API Worker serves as /script.js (static assets). Run by
 * `bun run build` and by wrangler before dev and deploy.
 * `bun run check:tracker-size` enforces the 2 KB gzip budget on the output.
 */
import { gzipSync } from "node:zlib"

const OUTFILE = `${import.meta.dir}/../../apps/api/public/script.js`

const result = await Bun.build({
  entrypoints: [`${import.meta.dir}/src/index.ts`],
  target: "browser",
  format: "iife",
  minify: true,
})
const [output] = result.outputs
if (!result.success || !output) {
  console.error("Building the tracker failed:", ...result.logs)
  process.exit(1)
}

const code = await output.text()
await Bun.write(OUTFILE, code)
console.log(
  `tracker: ${code.length} bytes, ${gzipSync(code, { level: 9 }).byteLength} gzipped → apps/api/public/script.js`
)
