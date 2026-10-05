/**
 * Migration safety check (CI and `bun run check:migrations`).
 *
 * Production applies migrations before deploying the new Worker, so the old
 * Worker runs against the new schema for a while. This script fails when a
 * change would break that:
 *
 * - an existing migration or snapshot was edited, deleted or renamed
 * - the journal's existing entries changed (only appending is allowed)
 * - a new migration drops, renames or rebuilds something, adds a NOT NULL
 *   column without a default, or uses BEGIN/COMMIT (D1 rejects them)
 *
 * A contract-phase migration can opt out of the destructive checks with a
 * line `-- viewtally: allow-destructive <reason>`; it still needs review.
 *
 * Base: $MIGRATIONS_BASE_REF, else origin/main, else main.
 *
 * `--remote-pending` (deploy workflow): runs the SQL checks on exactly the
 * files production hasn't applied yet, read from $D1_APPLIED_OUTPUT.
 */
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"

const ROOT = resolve(import.meta.dir, "..")
const DIR = "packages/db/migrations"

export type Finding = { level: "error" | "warning"; message: string }

const ALLOW_DESTRUCTIVE = /^--\s*viewtally:\s*allow-destructive\s+\S+/m

const DESTRUCTIVE: [RegExp, string][] = [
  [/\bDROP\s+(TABLE|VIEW|TRIGGER)\b/i, "drops a table/view/trigger"],
  [/\bDROP\s+INDEX\b/i, "drops an index (onConflict targets may rely on it)"],
  [/\bALTER\s+TABLE\s+\S+\s+DROP\b/i, "drops a column"],
  [/\bALTER\s+TABLE\s+\S+\s+RENAME\b/i, "renames a table or column"],
  [
    /`?__new_\w+/i,
    "rebuilds a table (Drizzle's __new_ copy); rewrites every row",
  ],
]

/** Statements without comments, split the way Drizzle and wrangler split them. */
function statements(sql: string): string[] {
  return sql
    .replace(/--[^\n]*$/gm, "")
    .split(/--> statement-breakpoint|;/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function checkSql(sql: string): Finding[] {
  const findings: Finding[] = []
  const allowDestructive = ALLOW_DESTRUCTIVE.test(sql)
  const createdHere = new Set(
    [
      ...sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)/gi),
    ].map((m) => m[1]?.toLowerCase())
  )

  for (const statement of statements(sql)) {
    const short = statement.replace(/\s+/g, " ").slice(0, 80)

    if (/^(BEGIN|COMMIT|END|ROLLBACK|SAVEPOINT|RELEASE)\b/i.test(statement)) {
      findings.push({
        level: "error",
        message: `"${short}": D1 rejects transaction statements; wrangler already applies each file atomically`,
      })
    }

    for (const [pattern, what] of DESTRUCTIVE) {
      if (pattern.test(statement)) {
        findings.push({
          level: allowDestructive ? "warning" : "error",
          message: `"${short}" ${what}. The deployed Worker may still use it. ${
            allowDestructive
              ? "Allowed by marker; make sure no deployed code uses it."
              : "Use expand/contract (d1-migration skill) or add `-- viewtally: allow-destructive <reason>`."
          }`,
        })
      }
    }

    if (
      /^ALTER\s+TABLE\s+\S+\s+ADD\b/i.test(statement) &&
      /\bNOT\s+NULL\b/i.test(statement) &&
      !/\bDEFAULT\b/i.test(statement)
    ) {
      findings.push({
        level: "error",
        message: `"${short}" adds a NOT NULL column without a DEFAULT; SQLite rejects it and old code can't insert`,
      })
    }

    const uniqueOn = statement.match(
      /^CREATE\s+UNIQUE\s+INDEX\b[^(]*\bON\s+[`"]?(\w+)/i
    )?.[1]
    if (uniqueOn && !createdHere.has(uniqueOn.toLowerCase())) {
      findings.push({
        level: "warning",
        message: `"${short}" fails if existing rows have duplicates; check production data first`,
      })
    }

    if (/^(UPDATE|DELETE\s+FROM|INSERT\s+INTO)\b/i.test(statement)) {
      findings.push({
        level: "warning",
        message: `"${short}" changes data inside a migration; large tables can hit D1's 30 s query limit`,
      })
    }
  }
  return findings
}

type JournalEntry = { idx: number; tag: string; when: number }

export function checkJournal(
  before: JournalEntry[],
  after: JournalEntry[]
): Finding[] {
  for (const [i, old] of before.entries()) {
    const now = after[i]
    if (
      !now ||
      now.tag !== old.tag ||
      now.when !== old.when ||
      now.idx !== old.idx
    ) {
      return [
        {
          level: "error",
          message: `meta/_journal.json: existing entry ${old.tag} was changed or removed; only appending is allowed`,
        },
      ]
    }
  }
  return []
}

function git(args: string[]): { ok: boolean; out: string } {
  const result = Bun.spawnSync(["git", ...args], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  })
  return { ok: result.exitCode === 0, out: result.stdout.toString() }
}

function resolveBase(): string | null {
  if (!git(["rev-parse", "--is-inside-work-tree"]).ok) return null
  const candidates = [process.env.MIGRATIONS_BASE_REF, "origin/main", "main"]
  for (const ref of candidates) {
    if (
      ref &&
      !/^0+$/.test(ref) &&
      git(["rev-parse", "--verify", `${ref}^{commit}`]).ok
    ) {
      return ref
    }
  }
  return null
}

type Change = { status: string; path: string }

/** Committed changes since the merge base, plus uncommitted and untracked files. */
function changedFiles(base: string): Change[] {
  const changes = new Map<string, string>()
  const add = (out: string) => {
    for (const line of out.split("\n")) {
      const [status, ...paths] = line.split("\t")
      const path = paths.at(-1)
      if (status && path) changes.set(path, status[0] ?? "M")
      // A rename also deletes the old path.
      if (status?.startsWith("R") && paths[0]) changes.set(paths[0], "D")
    }
  }
  add(git(["diff", "--name-status", "-M", `${base}...HEAD`, "--", DIR]).out)
  add(git(["diff", "--name-status", "-M", "HEAD", "--", DIR]).out)
  for (const path of git([
    "ls-files",
    "--others",
    "--exclude-standard",
    "--",
    DIR,
  ]).out.split("\n")) {
    if (path) changes.set(path, "A")
  }
  return [...changes].map(([path, status]) => ({ path, status }))
}

export function run(): Finding[] {
  const findings: Finding[] = []
  const base = resolveBase()
  let newSql: string[]

  if (!base) {
    findings.push({
      level: "warning",
      message:
        "No git base found (not a repo, or no main/origin/main): checking every migration's SQL, but can't detect edits to existing ones.",
    })
    newSql = readdirSync(join(ROOT, DIR))
      .filter((f) => f.endsWith(".sql"))
      .map((f) => `${DIR}/${f}`)
  } else {
    const changes = changedFiles(base)
    newSql = []
    for (const { path, status } of changes) {
      if (path === `${DIR}/meta/_journal.json`) {
        const before = git(["show", `${base}:${path}`])
        if (before.ok && existsSync(join(ROOT, path))) {
          const parse = (text: string) =>
            (JSON.parse(text) as { entries: JournalEntry[] }).entries
          findings.push(
            ...checkJournal(
              parse(before.out),
              parse(readFileSync(join(ROOT, path), "utf8"))
            )
          )
        }
      } else if (status === "A") {
        if (path.endsWith(".sql")) newSql.push(path)
      } else {
        findings.push({
          level: "error",
          message: `${path} was ${status === "D" ? "deleted or renamed" : "modified"}. Applied migrations are immutable; add a new migration instead.`,
        })
      }
    }
  }

  for (const path of newSql) {
    for (const finding of checkSql(readFileSync(join(ROOT, path), "utf8"))) {
      findings.push({ ...finding, message: `${path}: ${finding.message}` })
    }
  }
  if (base)
    console.log(
      `Compared against ${base}; new migrations: ${newSql.join(", ") || "none"}`
    )
  return findings
}

/**
 * Pending = local migration files that production's `d1_migrations` table
 * doesn't list. `appliedOutput` is the stdout of
 * `wrangler d1 execute <db> --remote --json --command "SELECT name FROM d1_migrations"`.
 */
export function pendingMigrations(
  files: string[],
  appliedOutput: string,
  appliedStderr = ""
): { pending: string[]; findings: Finding[] } {
  let applied: string[]
  const start = appliedOutput.indexOf("[")
  try {
    if (start === -1) throw new Error("no JSON in output")
    const parsed = JSON.parse(appliedOutput.slice(start)) as {
      results?: { name?: unknown }[]
    }[]
    applied = parsed
      .flatMap((r) => r.results ?? [])
      .map((row) => String(row.name))
  } catch {
    if (/no such table: d1_migrations/i.test(appliedStderr + appliedOutput)) {
      applied = [] // Fresh database: everything is pending.
    } else {
      return {
        pending: [],
        findings: [
          {
            level: "error",
            message: `Couldn't read applied migrations from production:\n${appliedStderr || appliedOutput}`,
          },
        ],
      }
    }
  }

  const findings: Finding[] = []
  for (const name of applied) {
    if (!files.includes(name)) {
      findings.push({
        level: "error",
        message: `Production has migration ${name}, which isn't in ${DIR}. It was renamed, deleted or applied by hand; fix that before deploying.`,
      })
    }
  }
  return { pending: files.filter((f) => !applied.includes(f)), findings }
}

function runRemote(): Finding[] {
  const files = readdirSync(join(ROOT, DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort()
  const { pending, findings } = pendingMigrations(
    files,
    process.env.D1_APPLIED_OUTPUT ?? "",
    process.env.D1_APPLIED_STDERR ?? ""
  )
  for (const file of pending) {
    for (const finding of checkSql(
      readFileSync(join(ROOT, DIR, file), "utf8")
    )) {
      findings.push({ ...finding, message: `${file}: ${finding.message}` })
    }
  }
  const summary = `Pending migrations: ${pending.join(", ") || "none"}`
  console.log(summary)
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### D1\n\n${summary}\n`)
  }
  return findings
}

if (import.meta.main) {
  const findings = process.argv.includes("--remote-pending")
    ? runRemote()
    : run()
  const inCi = process.env.GITHUB_ACTIONS === "true"
  for (const f of findings) {
    console.log(
      inCi
        ? `::${f.level}::${f.message}`
        : `${f.level === "error" ? "✖" : "⚠"} ${f.message}`
    )
  }
  const errors = findings.filter((f) => f.level === "error").length
  console.log(`${errors} error(s), ${findings.length - errors} warning(s)`)
  process.exit(errors > 0 ? 1 : 0)
}
