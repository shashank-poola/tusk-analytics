/**
 * PreToolUse hook for Bash and PowerShell: blocks commands that touch remote
 * services, secrets, git history or committed migrations.
 *
 * This is a backstop for the deny rules in .claude/settings.json, not a
 * sandbox: it matches command text, so `sh -c "$(echo ...)"` tricks get past
 * it. Keep each rule's message actionable.
 */
import { block, readHookInput } from "./lib/hook"

type Rule = { test: (command: string) => boolean; reason: string }

const re = (pattern: RegExp) => (command: string) => pattern.test(command)

// `git -C dir -c k=v push` is still a push.
const GIT = String.raw`\bgit(?:\s+(?:-[Cc]\s+\S+|--?[\w-]+(?:=\S+)?))*\s+`

/** Secret files by name; `.env.example` is fine. */
const SECRET_FILE =
  /(^|[\s"'=:/\\<>(])(\.dev\.vars[\w.-]*|\.env(?:\.(?!example\b)[\w.-]+)?)(?=$|[\s"'<>;|&),])/

const MIGRATIONS =
  /packages[\\/]+db[\\/]+migrations|(^|[\s"'/\\])migrations[\\/]/

const RM_RECURSIVE =
  /\brm\s+(?:-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)\b|\bRemove-Item\b[^;|&\n]*-Recurse/i

/** Build output that is always safe to delete. */
const DISPOSABLE =
  /^(?:\.\/)?(?:[\w-]+\/)*(node_modules|\.next|dist|\.turbo|coverage|out|build)\/?$/

export const RULES: Rule[] = [
  {
    test: re(new RegExp(`${GIT}push\\b`)),
    reason: "git push is off-limits for agents. Leave pushing to the user.",
  },
  {
    test: re(
      new RegExp(
        `${GIT}(?:reset\\s+[^;|&\\n]*--hard|clean\\s+-[a-zA-Z]*f|branch\\s+-D|checkout\\s+(?:-f|--force)|stash\\s+(?:drop|clear)|filter-branch|filter-repo|update-ref\\s+-d|reflog\\s+(?:expire|delete))`
      )
    ),
    reason:
      "This git command discards work or rewrites history. Ask the user to run it.",
  },
  {
    test: re(/--force\b|--no-verify\b/),
    reason:
      "Force flags and --no-verify are blocked. Fix the underlying problem or ask the user.",
  },
  {
    test: re(
      /--remote\b|db:(?:migrate|studio):remote|DB_TARGET=remote|\bd1-http\b/
    ),
    reason:
      "Remote D1 access is blocked. Use the local database (bun run db:migrate); production migrations run only in .github/workflows/deploy.yml.",
  },
  {
    test: re(/\bdrizzle-kit\s+(?:push|migrate|drop)\b/),
    reason:
      "Use `bun run db:generate` to write a migration file and `bun run db:migrate` to apply it locally. drizzle-kit push/migrate/drop bypass review.",
  },
  {
    // `wrangler deploy --dry-run` only bundles locally, so it stays allowed.
    test: (command) =>
      /\bwrangler\b[^;|&\n]*\b(?:deploy|publish|rollback|secret|delete|time-travel\s+restore)\b/.test(
        command
      ) && !/\bwrangler\s+deploy\b[^;|&\n]*--dry-run\b/.test(command),
    reason:
      "Deploys, rollbacks, secrets and deletes go through the deploy workflow or the user (docs/runbooks/deploy.md).",
  },
  {
    test: re(
      /\bopennextjs-cloudflare\s+(?:deploy|upload)\b|\bvercel\b[^;|&\n]*(?:--prod\b|\bdeploy\b)|\b(?:bun|npm|pnpm|yarn)\s+(?:run\s+)?(?:--filter[=\s]\S+\s+)?deploy\b/
    ),
    reason: "Deploys go through .github/workflows/deploy.yml, not the agent.",
  },
  {
    test: re(SECRET_FILE),
    reason:
      "Commands may not touch .dev.vars or .env files. Ask the user for the specific non-secret value you need; use .env.example for variable names.",
  },
  {
    test: re(
      /\bgh\s+(?:secret|variable|release|workflow\s+run|run\s+rerun|pr\s+merge|repo\s+(?:delete|edit|rename))\b|\bgh\s+api\b[^;|&\n]*(?:-X|--method)\s*(?:POST|PUT|PATCH|DELETE)\b/i
    ),
    reason: "GitHub write operations are blocked. Ask the user.",
  },
  {
    test: re(
      /\b(?:curl|wget|iwr|Invoke-WebRequest|irm|Invoke-RestMethod)\b[^|\n]*\|\s*(?:sh|bash|zsh|iex|Invoke-Expression)\b/i
    ),
    reason: "Piping a download into a shell is blocked.",
  },
  {
    test: (command) => touchesMigrations(command),
    reason:
      "Shell commands may not modify packages/db/migrations. Generate migrations with `bun run db:generate`; never edit or delete committed ones.",
  },
  {
    test: (command) => dangerousRecursiveDelete(command),
    reason:
      "Recursive delete outside build output (node_modules, .next, dist, .turbo, coverage) is blocked. Delete specific files, or ask the user.",
  },
]

/** Writes, moves or deletes that target a migrations folder. */
function touchesMigrations(command: string): boolean {
  if (!MIGRATIONS.test(command)) return false
  for (const segment of command.split(/&&|\|\||;|\||\n/)) {
    if (!MIGRATIONS.test(segment)) continue
    const redirect = segment.match(/(?:^|[^0-9&>])>{1,2}\s*["']?([^\s"';|&]+)/)
    if (redirect?.[1] && MIGRATIONS.test(redirect[1])) return true
    if (
      /\b(?:rm|truncate|unlink|Remove-Item|Clear-Content|Set-Content|Add-Content|Out-File|Rename-Item)\b|\bsed\s+(?:-[a-zA-Z]*i|--in-place)|\btee\b/i.test(
        segment
      )
    ) {
      return true
    }
    // cp/mv/Copy-Item/Move-Item: blocked when the destination (last argument)
    // is a migrations folder, or when moving a file out of one.
    const copy = segment.match(/\b(cp|mv|Copy-Item|Move-Item)\b(.*)$/i)
    if (copy?.[2]) {
      const args = copy[2]
        .trim()
        .split(/\s+/)
        .filter((a) => !a.startsWith("-"))
      const destination = args.at(-1) ?? ""
      if (MIGRATIONS.test(destination)) return true
      if (/^(mv|Move-Item)$/i.test(copy[1] ?? "")) return true
    }
  }
  return false
}

function dangerousRecursiveDelete(command: string): boolean {
  for (const segment of command.split(/&&|\|\||;|\||\n/)) {
    if (!RM_RECURSIVE.test(segment)) continue
    const tokens = segment.trim().split(/\s+/)
    const start = tokens.findIndex((t) => /^(rm|Remove-Item)$/i.test(t))
    const targets = tokens
      .slice(start + 1)
      .map((t) => t.replace(/^["']|["',]$/g, "").replaceAll("\\", "/"))
      .filter((t) => t && !t.startsWith("-"))
    if (targets.length === 0) return true
    if (targets.some((t) => !DISPOSABLE.test(t))) return true
  }
  return false
}

export function findViolation(command: string): string | null {
  return RULES.find((rule) => rule.test(command))?.reason ?? null
}

if (import.meta.main) {
  const input = await readHookInput()
  const command = input.tool_input?.command
  if (command) {
    const reason = findViolation(command)
    if (reason) block(reason)
  }
}
