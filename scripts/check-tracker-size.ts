/**
 * Fails when the built tracker exceeds its size budget. Run after
 * `bun run build`. Skips with a notice while packages/tracker doesn't exist.
 *
 * Budget: 2 KB gzipped per file in packages/tracker/dist. The script loads on
 * every pageview of every customer site; comparable analytics scripts ship
 * around 1-2 KB. Raise it only with the owner's agreement.
 */
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { gzipSync } from "node:zlib"

export const BUDGET_GZIP_BYTES = 2048

const ROOT = resolve(import.meta.dir, "..")
const PACKAGE = join(ROOT, "packages", "tracker")
const DIST = join(PACKAGE, "dist")
const inCi = process.env.GITHUB_ACTIONS === "true"

export function gzipSize(contents: Uint8Array): number {
  return gzipSync(contents, { level: 9 }).byteLength
}

if (import.meta.main) {
  if (!existsSync(PACKAGE)) {
    console.log(
      `${inCi ? "::notice::" : ""}packages/tracker doesn't exist yet; skipping the size check.`
    )
    process.exit(0)
  }

  const files = existsSync(DIST)
    ? readdirSync(DIST).filter((f) => f.endsWith(".js"))
    : []
  if (files.length === 0) {
    console.error(
      `${inCi ? "::error::" : ""}No .js files in packages/tracker/dist. Run \`bun run build\` first.`
    )
    process.exit(1)
  }

  let failed = false
  const rows: string[] = []
  for (const file of files) {
    const contents = readFileSync(join(DIST, file))
    const size = gzipSize(contents)
    const over = size > BUDGET_GZIP_BYTES
    failed ||= over
    rows.push(
      `| ${file} | ${contents.byteLength} | ${size} | ${BUDGET_GZIP_BYTES} | ${over ? "❌ over" : "✅"} |`
    )
    if (over && inCi) {
      console.log(
        `::error file=packages/tracker/dist/${file}::${size} bytes gzipped, budget ${BUDGET_GZIP_BYTES}`
      )
    }
  }

  const table = [
    "| File | Raw bytes | Gzip bytes | Budget | |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n")
  console.log(table)
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Tracker size\n\n${table}\n`
    )
  }
  process.exit(failed ? 1 : 0)
}
