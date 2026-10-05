import { isAbsolute, relative, resolve } from "node:path"

/** The fields of Claude Code's hook input that these scripts use. */
export type HookInput = {
  tool_name?: string
  cwd?: string
  tool_input?: {
    command?: string
    file_path?: string
    notebook_path?: string
  }
}

/** Repo root: Claude Code exports CLAUDE_PROJECT_DIR to every hook. */
export function repoRoot(): string {
  return process.env.CLAUDE_PROJECT_DIR ?? resolve(import.meta.dir, "../../..")
}

export async function readHookInput(): Promise<HookInput> {
  const raw = await Bun.stdin.text()
  try {
    return JSON.parse(raw) as HookInput
  } catch {
    return {}
  }
}

/**
 * Repo-relative POSIX path (`apps/api/.dev.vars`), or null when the path is
 * outside the repo. Windows paths and drive-letter casing are normalized.
 */
export function toRepoPath(filePath: string, root = repoRoot()): string | null {
  const absolute = isAbsolute(filePath) ? filePath : resolve(root, filePath)
  const rel = relative(root, absolute).replaceAll("\\", "/")
  if (rel.startsWith("../") || rel === ".." || isAbsolute(rel)) return null
  return rel
}

/**
 * Exit code 2 blocks a PreToolUse call; Claude sees stderr as the reason.
 * Every message says what to do instead, so Claude doesn't try a workaround.
 */
export function block(reason: string): never {
  process.stderr.write(`Blocked by .claude/scripts hook: ${reason}\n`)
  process.exit(2)
}
