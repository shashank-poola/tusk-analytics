import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { checkJournal, checkSql, pendingMigrations } from "./check-migrations"
import {
  parseFrontmatter,
  validateAgent,
  validateRepo,
  validateSkill,
} from "./validate-agent-files"

const errorsOf = (problems: { level: string; message: string }[]) =>
  problems.filter((p) => p.level === "error").map((p) => p.message)

describe("checkSql", () => {
  it("accepts additive changes", () => {
    const sql = [
      "CREATE TABLE `goals` (`id` text PRIMARY KEY NOT NULL, `site_id` text NOT NULL);",
      "--> statement-breakpoint",
      "CREATE UNIQUE INDEX `goals_site_uq` ON `goals` (`site_id`);",
      "--> statement-breakpoint",
      "ALTER TABLE `sites` ADD `plan` text DEFAULT 'free' NOT NULL;",
      "--> statement-breakpoint",
      "ALTER TABLE `sites` ADD `note` text;",
    ].join("\n")

    expect(checkSql(sql)).toEqual([])
  })

  it.each([
    ["DROP TABLE `events`;", "drops a table"],
    ["ALTER TABLE `sites` DROP COLUMN `domain`;", "drops a column"],
    ["ALTER TABLE `sites` RENAME COLUMN `domain` TO `host`;", "renames"],
    ["DROP INDEX `payments_site_paid_idx`;", "drops an index"],
    ["CREATE TABLE `__new_sites` (`id` text);", "rebuilds"],
    [
      "ALTER TABLE `sites` ADD `plan` text NOT NULL;",
      "NOT NULL column without a DEFAULT",
    ],
    ["BEGIN TRANSACTION;", "transaction statements"],
  ])("rejects %s", (sql, message) => {
    const findings = checkSql(sql)
    expect(
      findings.some((f) => f.level === "error" && f.message.includes(message))
    ).toBe(true)
  })

  it("downgrades destructive changes to warnings with the marker", () => {
    const sql =
      "-- viewtally: allow-destructive domain unused since v12\nALTER TABLE `sites` DROP COLUMN `domain`;"

    const findings = checkSql(sql)

    expect(findings).toHaveLength(1)
    expect(findings[0]?.level).toBe("warning")
  })

  it("warns about unique indexes on existing tables and data changes", () => {
    const findings = checkSql(
      "CREATE UNIQUE INDEX `x` ON `sites` (`domain`);\nUPDATE `sites` SET `plan` = 'free';"
    )

    expect(findings.map((f) => f.level)).toEqual(["warning", "warning"])
  })

  it("passes the repo's existing migrations", async () => {
    for (const name of ["0000_init.sql", "0001_rate_limit.sql"]) {
      const sql = await Bun.file(
        join(import.meta.dir, "..", "packages/db/migrations", name)
      ).text()
      expect(errorsOf(checkSql(sql))).toEqual([])
    }
  })
})

describe("pendingMigrations", () => {
  const files = ["0000_init.sql", "0001_rate_limit.sql", "0002_goals.sql"]
  const output = (names: string[]) =>
    `⛅️ wrangler\n${JSON.stringify([
      { results: names.map((name) => ({ name })), success: true },
    ])}`

  it("lists files production hasn't applied", () => {
    const result = pendingMigrations(
      files,
      output(["0000_init.sql", "0001_rate_limit.sql"])
    )

    expect(result.pending).toEqual(["0002_goals.sql"])
    expect(result.findings).toEqual([])
  })

  it("treats a database without d1_migrations as fresh", () => {
    const result = pendingMigrations(
      files,
      "",
      "D1_ERROR: no such table: d1_migrations"
    )

    expect(result.pending).toEqual(files)
  })

  it("fails on unreadable output and on unknown applied migrations", () => {
    expect(
      pendingMigrations(files, "", "Authentication error").findings
    ).toHaveLength(1)
    expect(
      pendingMigrations(files, output(["0000_old_name.sql"])).findings[0]
        ?.message
    ).toContain("0000_old_name.sql")
  })
})

describe("checkJournal", () => {
  const a = { idx: 0, tag: "0000_init", when: 1 }
  const b = { idx: 1, tag: "0001_rate_limit", when: 2 }

  it("allows appending", () => {
    expect(checkJournal([a], [a, b])).toEqual([])
  })

  it("rejects edited or removed entries", () => {
    expect(checkJournal([a, b], [a])).toHaveLength(1)
    expect(checkJournal([a], [{ ...a, tag: "0000_other" }])).toHaveLength(1)
  })
})

function skillDir(name: string, files: Record<string, string>) {
  const dir = join(mkdtempSync(join(tmpdir(), "skill-")), name)
  mkdirSync(join(dir, "references"), { recursive: true })
  for (const [path, contents] of Object.entries(files)) {
    writeFileSync(join(dir, path), contents)
  }
  return dir
}

const goodSkill = `---
name: demo-skill
description: Does a demo thing for tests. Use when testing the validator.
---

# Demo

See [the reference](references/more.md).
`

describe("validateSkill", () => {
  it("accepts a valid skill", () => {
    const dir = skillDir("demo-skill", { "references/more.md": "# More" })

    expect(errorsOf(validateSkill(dir, goodSkill, dir))).toEqual([])
  })

  it("requires name to match the folder and follow the spec", () => {
    const dir = skillDir("other-name", { "references/more.md": "# More" })

    expect(errorsOf(validateSkill(dir, goodSkill, dir))).toContain(
      '`name` "demo-skill" must match its folder "other-name"'
    )
    expect(
      errorsOf(
        validateSkill(dir, goodSkill.replace("demo-skill", "Demo--Skill"), dir)
      ).length
    ).toBeGreaterThan(0)
  })

  it("rejects long descriptions, broken links and telemetry", () => {
    const dir = skillDir("demo-skill", {})
    const content = goodSkill
      .replace(/description: .*/, `description: ${"x".repeat(1025)}`)
      .concat("\nRun node scripts/skill-usage.mjs record-skill demo first.\n")

    const errors = errorsOf(validateSkill(dir, content, dir))

    expect(errors.some((e) => e.includes("max 1024"))).toBe(true)
    expect(errors.some((e) => e.includes("broken link"))).toBe(true)
    expect(errors.some((e) => e.includes("telemetry"))).toBe(true)
  })

  it("rejects a file without frontmatter", () => {
    expect(parseFrontmatter("# no frontmatter")).toHaveProperty("error")
  })
})

const reviewer = (frontmatter: string) => `---
name: demo-reviewer
description: Reviews demo things. Use after demo changes.
${frontmatter}
---

${"You review things carefully and report findings with file and line. ".repeat(5)}
`

describe("validateAgent", () => {
  const path = join(tmpdir(), "demo-reviewer.md")

  it("accepts a read-only reviewer with the git hook", () => {
    const content = reviewer(`tools: Read, Grep, Glob, Bash
model: sonnet
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: bun
          args: ["\${CLAUDE_PROJECT_DIR}/.claude/scripts/readonly-bash.ts"]`)

    expect(
      errorsOf(validateAgent(path, content, join(import.meta.dir, "..")))
    ).toEqual([])
  })

  it("rejects write tools, unguarded Bash, typos and unknown models", () => {
    const content = reviewer(`tools: Read, Edit, Bash
model: gpt-5
disallowed-tools: Write`)

    const errors = errorsOf(validateAgent(path, content))

    expect(errors).toContain('reviewers must be read-only; remove "Edit"')
    expect(errors.some((e) => e.includes("readonly-bash.ts"))).toBe(true)
    expect(errors.some((e) => e.includes('"disallowed-tools"'))).toBe(true)
    expect(errors.some((e) => e.includes("`model`"))).toBe(true)
  })
})

describe("this repo", () => {
  it("has no agent-file errors", () => {
    expect(errorsOf(validateRepo())).toEqual([])
  })
})
