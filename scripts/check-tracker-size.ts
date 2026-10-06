/**
 * Fails when the built tracker exceeds its size budget. Run after
 * `bun run build`, which writes it to apps/api/public/script.js.
 *
 * Budget: 2 KB gzipped. The script loads on every pageview of every customer
 * site; comparable analytics scripts ship around 1-2 KB. Raise it only with
 * the owner's agreement.
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { gzipSync } from "node:zlib"

export const BUDGET_GZIP_BYTES = 2048

const ROOT = resolve(import.meta.dir, "..")
const SCRIPT = "apps/api/public/script.js"
const inCi = process.env.GITHUB_ACTIONS === "true"

export function gzipSize(contents: Uint8Array): number {
  return gzipSync(contents, { level: 9 }).byteLength
}

if (import.meta.main) {
  const path = join(ROOT, SCRIPT)
  if (!existsSync(path)) {
    console.error(
      `${inCi ? "::error::" : ""}${SCRIPT} doesn't exist. Run \`bun run build\` first.`
    )
    process.exit(1)
  }

  const contents = readFileSync(path)
  const size = gzipSize(contents)
  const over = size > BUDGET_GZIP_BYTES
  if (over && inCi) {
    console.log(
      `::error file=packages/tracker/src/index.ts::${size} bytes gzipped, budget ${BUDGET_GZIP_BYTES}`
    )
  }

  const table = [
    "| File | Raw bytes | Gzip bytes | Budget | |",
    "| --- | --- | --- | --- | --- |",
    `| ${SCRIPT} | ${contents.byteLength} | ${size} | ${BUDGET_GZIP_BYTES} | ${over ? "❌ over" : "✅"} |`,
  ].join("\n")
  console.log(table)
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Tracker size\n\n${table}\n`
    )
  }
  process.exit(over ? 1 : 0)
}
