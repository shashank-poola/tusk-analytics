/**
 * PostToolUse hook for Edit, Write and MultiEdit: formats the file with the
 * repo's Prettier config. `--ignore-unknown` skips file types Prettier can't
 * parse, and .prettierignore still applies.
 *
 * Exit 2 on a PostToolUse hook doesn't undo the edit; it only shows stderr to
 * Claude, which is what we want when the file no longer parses.
 */
import { readHookInput, repoRoot, toRepoPath } from "./lib/hook"

if (import.meta.main) {
  const input = await readHookInput()
  const filePath = input.tool_input?.file_path
  const root = repoRoot()
  const repoPath = filePath ? toRepoPath(filePath, root) : null

  if (repoPath && !repoPath.startsWith("node_modules/")) {
    const result = Bun.spawnSync(
      [
        process.execPath,
        "x",
        "prettier",
        "--write",
        "--ignore-unknown",
        "--log-level=warn",
        repoPath,
      ],
      { cwd: root, stdout: "ignore", stderr: "pipe" }
    )
    if (result.exitCode !== 0) {
      process.stderr.write(
        `Prettier could not format ${repoPath}:\n${result.stderr.toString()}`
      )
      process.exit(2)
    }
  }
}
