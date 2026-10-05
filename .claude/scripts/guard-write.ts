/**
 * PreToolUse hook for Edit, Write, MultiEdit and NotebookEdit: blocks writes
 * to secret files and to migrations that are already committed.
 *
 * "Applied" is approximated as "committed": once a migration is in git it may
 * be on its way to production, and D1 records applied migrations by file
 * name, so a later edit would never run there. New, uncommitted migrations
 * (fresh from `bun run db:generate`) can still be edited.
 */
import { existsSync } from "node:fs"
import { join, posix } from "node:path"

import { block, readHookInput, repoRoot, toRepoPath } from "./lib/hook"

const MIGRATIONS_DIR = "packages/db/migrations/"

type Repo = {
  exists: (repoPath: string) => boolean
  /** true/false from git; null when git can't tell (no repo, no HEAD). */
  isCommitted: (repoPath: string) => boolean | null
}

export function isSecretFile(repoPath: string): boolean {
  const name = posix.basename(repoPath)
  if (name.startsWith(".dev.vars")) return true
  return (
    (name === ".env" || name.startsWith(".env.")) && name !== ".env.example"
  )
}

export function findWriteViolation(
  repoPath: string,
  repo: Repo
): string | null {
  if (isSecretFile(repoPath)) {
    return `${repoPath} holds secrets and is off-limits. Tell the user which variable to set; add new variable names to .env.example or env.ts instead.`
  }

  if (repoPath.startsWith(".git/")) {
    return "Don't write inside .git/."
  }

  if (!repoPath.startsWith(MIGRATIONS_DIR)) return null

  if (repoPath.startsWith(`${MIGRATIONS_DIR}meta/`)) {
    return "packages/db/migrations/meta is written by drizzle-kit. Change src/schema/*.ts and run `bun run db:generate`."
  }

  if (!repo.exists(repoPath)) return null

  const committed = repo.isCommitted(repoPath)
  if (committed === false) return null

  const why =
    committed === null
      ? "git can't tell whether it is committed, so it is treated as applied"
      : "it is committed, so it may already be applied in production"
  return `${repoPath} is frozen (${why}). Add a new migration instead: change src/schema/*.ts, run \`bun run db:generate\`, or \`bunx drizzle-kit generate --custom --name=<name>\` in packages/db for hand-written SQL.`
}

export function gitRepo(root: string): Repo {
  return {
    exists: (repoPath) => existsSync(join(root, repoPath)),
    isCommitted: (repoPath) => {
      const inside = Bun.spawnSync(["git", "rev-parse", "--verify", "HEAD"], {
        cwd: root,
        stdout: "ignore",
        stderr: "ignore",
      })
      if (inside.exitCode !== 0) return null
      const result = Bun.spawnSync(
        ["git", "cat-file", "-e", `HEAD:${repoPath}`],
        {
          cwd: root,
          stdout: "ignore",
          stderr: "ignore",
        }
      )
      return result.exitCode === 0
    },
  }
}

if (import.meta.main) {
  const input = await readHookInput()
  const filePath =
    input.tool_input?.file_path ?? input.tool_input?.notebook_path
  if (filePath) {
    const root = repoRoot()
    const repoPath = toRepoPath(filePath, root)
    const reason = repoPath
      ? findWriteViolation(repoPath, gitRepo(root))
      : isSecretFile(filePath.replaceAll("\\", "/"))
        ? `${filePath} looks like a secrets file and is off-limits.`
        : null
    if (reason) block(reason)
  }
}
