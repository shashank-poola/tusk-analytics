/**
 * PreToolUse hook used by the reviewer subagents (see their frontmatter):
 * Bash may only run read-only git commands, optionally piped into simple
 * text filters. Everything else is blocked, so reviewers stay read-only.
 */
import { block, readHookInput } from "./lib/hook"

const GIT_READ =
  /^git\s+(?:status|diff|log|show|blame|ls-files|rev-parse|merge-base|shortlog|branch\s+--show-current|branch\s+(?:-a|-r|--list)?\s*$)(?:\s|$)/

const FILTER = /^(?:head|tail|wc|sort|uniq|grep|cut)(?:\s|$)/

/** Options that make read-only git commands write files or run programs. */
const UNSAFE =
  /--output\b|--ext-diff\b|--textconv\b|\s-c\s|\s-C\s|--exec\b|[`]|\$\(|>|<\(/

export function isReadOnly(command: string): boolean {
  if (UNSAFE.test(` ${command} `)) return false
  const segments = command.split(/\|/).map((s) => s.trim())
  if (segments.some((s) => s === "" || /&&|\|\||;|&|\n/.test(s))) return false
  const [first, ...rest] = segments
  return GIT_READ.test(first ?? "") && rest.every((s) => FILTER.test(s))
}

if (import.meta.main) {
  const input = await readHookInput()
  const command = input.tool_input?.command?.trim()
  if (command && !isReadOnly(command)) {
    block(
      "Reviewers are read-only: Bash allows only `git status|diff|log|show|blame|ls-files` (optionally piped to head/tail/grep/wc). Use Read, Grep and Glob for files."
    )
  }
}
