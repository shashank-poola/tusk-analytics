/**
 * Validates the agent tooling: skills (.claude/skills/<name>/SKILL.md)
 * against the Agent Skills spec (agentskills.io/specification) plus this
 * repo's rules, subagents (.claude/agents), rules (.claude/rules),
 * .claude/settings.json hook paths, CLAUDE.md and the .agents/skills link.
 *
 * Usage: bun scripts/validate-agent-files.ts   (exit 1 on any error)
 */
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
} from "node:fs"
import { basename, join, relative, resolve } from "node:path"

export type Problem = {
  file: string
  level: "error" | "warning"
  message: string
}

const ROOT = resolve(import.meta.dir, "..")

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RESERVED_SKILL_NAMES = ["synced", "anthropic-skills"]

/** Agent Skills spec fields plus the Claude Code extensions. */
const SKILL_KEYS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
  "when_to_use",
  "argument-hint",
  "arguments",
  "disable-model-invocation",
  "user-invocable",
  "disallowed-tools",
  "model",
  "effort",
  "context",
  "agent",
  "background",
  "hooks",
  "paths",
  "shell",
])

/** Claude Code ignores misspelled subagent keys silently, so be strict. */
const AGENT_KEYS = new Set([
  "name",
  "description",
  "tools",
  "disallowedTools",
  "model",
  "permissionMode",
  "maxTurns",
  "skills",
  "mcpServers",
  "hooks",
  "memory",
  "background",
  "omitClaudeMd",
  "effort",
  "isolation",
  "color",
  "initialPrompt",
  "experimental",
])

const KNOWN_TOOLS = new Set([
  "Read",
  "Grep",
  "Glob",
  "Edit",
  "Write",
  "Bash",
  "PowerShell",
  "NotebookEdit",
  "WebFetch",
  "WebSearch",
  "TodoWrite",
  "Skill",
  "ToolSearch",
  "LSP",
  "Monitor",
  "Agent",
])
const WRITE_TOOLS = ["Edit", "Write", "NotebookEdit", "PowerShell"]
const MODELS = new Set(["sonnet", "opus", "haiku", "fable", "inherit"])
const COLORS = new Set([
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "pink",
  "cyan",
])

const SKILL_MAX_LINES = 500 // spec recommendation
const SKILL_SHORT_LINES = 150 // this repo: keep SKILL.md short
const TELEMETRY = /telemetry|record-skill|skill-usage/i
const REPO_PATH =
  /`((?:apps|packages|scripts|docs|\.claude|\.github)\/[^`\s]+)`/g

type Frontmatter = { data: Record<string, unknown>; body: string }

export function parseFrontmatter(
  content: string
): Frontmatter | { error: string } {
  const text = content.replace(/^﻿/, "").replaceAll("\r\n", "\n")
  if (!text.startsWith("---\n")) {
    return { error: "must start with a `---` frontmatter block" }
  }
  const end = text.indexOf("\n---", 4)
  if (end === -1) return { error: "frontmatter block is not closed with `---`" }
  try {
    const data: unknown = Bun.YAML.parse(text.slice(4, end))
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return { error: "frontmatter must be a YAML mapping" }
    }
    return {
      data: data as Record<string, unknown>,
      body: text.slice(end + 4).replace(/^\n/, ""),
    }
  } catch (error) {
    return { error: `frontmatter is not valid YAML: ${String(error)}` }
  }
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === "string") {
    return value
      .split(/,(?![^(]*\))/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

/** Relative markdown links ([x](references/y.md)) that don't resolve. */
function brokenLinks(body: string, fromDir: string): string[] {
  const broken: string[] = []
  for (const [, target] of body.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (!target || /^(?:[a-z]+:|#|\/)/i.test(target)) continue
    const path = target.split("#")[0] ?? ""
    if (path && !existsSync(join(fromDir, path))) broken.push(target)
  }
  return broken
}

/** Backticked repo paths that don't exist (placeholders and globs skipped). */
function missingRepoPaths(text: string, root: string): string[] {
  const missing = new Set<string>()
  for (const [, raw] of text.matchAll(REPO_PATH)) {
    if (!raw || /[<>*{}$]|\.\.\./.test(raw)) continue
    const path = raw.replace(/[:#].*$/, "").replace(/[.,;)]+$/, "")
    if (!existsSync(join(root, path))) missing.add(path)
  }
  return [...missing]
}

export function validateSkill(
  dir: string,
  content: string,
  root = ROOT
): Problem[] {
  const file = relative(root, join(dir, "SKILL.md")).replaceAll("\\", "/")
  const problems: Problem[] = []
  const error = (message: string) =>
    problems.push({ file, level: "error", message })
  const warn = (message: string) =>
    problems.push({ file, level: "warning", message })

  const parsed = parseFrontmatter(content)
  if ("error" in parsed) {
    error(parsed.error)
    return problems
  }
  const { data, body } = parsed
  const folder = basename(dir)

  for (const key of Object.keys(data)) {
    if (!SKILL_KEYS.has(key)) warn(`unknown frontmatter key "${key}"`)
  }

  const name = data.name
  if (typeof name !== "string" || name.length === 0) {
    error("`name` is required")
  } else {
    if (name.length > 64) error("`name` must be at most 64 characters")
    if (!NAME.test(name)) {
      error(
        "`name` must be lowercase letters, digits and single hyphens, not starting or ending with a hyphen"
      )
    }
    if (name !== folder) {
      error(`\`name\` "${name}" must match its folder "${folder}"`)
    }
    if (
      RESERVED_SKILL_NAMES.some((r) => name === r || name.startsWith(`${r}:`))
    ) {
      error(`\`name\` "${name}" is reserved`)
    }
  }

  const description = data.description
  if (typeof description !== "string" || description.trim().length === 0) {
    error("`description` is required")
  } else {
    if (description.length > 1024) {
      error(`\`description\` is ${description.length} characters; max 1024`)
    }
    if (!/\buse (?:when|for|this|it)\b/i.test(description)) {
      warn('`description` should say when to use the skill ("Use when ...")')
    }
  }

  if (
    data.compatibility !== undefined &&
    (typeof data.compatibility !== "string" ||
      data.compatibility.length === 0 ||
      data.compatibility.length > 500)
  ) {
    error("`compatibility` must be 1-500 characters")
  }

  if (data.metadata !== undefined) {
    const metadata = data.metadata
    if (
      typeof metadata !== "object" ||
      metadata === null ||
      Array.isArray(metadata) ||
      Object.values(metadata).some((v) => typeof v !== "string")
    ) {
      error("`metadata` must map string keys to string values")
    }
  }

  const lines = body.split("\n").length
  if (body.trim().length === 0) error("SKILL.md has no instructions")
  if (lines > SKILL_MAX_LINES) {
    error(`SKILL.md body is ${lines} lines; max ${SKILL_MAX_LINES}`)
  } else if (lines > SKILL_SHORT_LINES) {
    warn(
      `SKILL.md body is ${lines} lines; move detail into references/ (target ${SKILL_SHORT_LINES})`
    )
  }

  for (const link of brokenLinks(body, dir)) error(`broken link: ${link}`)

  const all = [content, ...readReferences(dir)]
  if (all.some((text) => TELEMETRY.test(text))) {
    error("skills must not contain telemetry steps")
  }
  for (const path of missingRepoPaths(all.join("\n"), root)) {
    warn(`mentions \`${path}\`, which doesn't exist (yet?)`)
  }

  const refsDir = join(dir, "references")
  if (existsSync(refsDir)) {
    for (const ref of readdirSync(refsDir)) {
      const text = readFileSync(join(refsDir, ref), "utf8")
      if (/\]\((?!https?:)[^)]*references\//.test(text)) {
        warn(
          `references/${ref} links to another reference; keep references one level deep`
        )
      }
    }
  }

  return problems
}

function readReferences(dir: string): string[] {
  const refsDir = join(dir, "references")
  if (!existsSync(refsDir)) return []
  return readdirSync(refsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readFileSync(join(refsDir, f), "utf8"))
}

/** Hook script paths in `args` (exec form) that don't exist. */
function missingHookScripts(hooks: unknown, root: string): string[] {
  const missing: string[] = []
  const visit = (node: unknown) => {
    if (Array.isArray(node)) node.forEach(visit)
    else if (node && typeof node === "object") {
      const entry = node as Record<string, unknown>
      const parts = [
        entry.command,
        ...(Array.isArray(entry.args) ? entry.args : []),
      ]
      for (const part of parts) {
        if (typeof part !== "string") continue
        const match = part.match(/\$\{CLAUDE_PROJECT_DIR\}\/(\S+)/)
        if (match?.[1] && !existsSync(join(root, match[1])))
          missing.push(match[1])
      }
      Object.values(entry).forEach(visit)
    }
  }
  visit(hooks)
  return missing
}

export function validateAgent(
  path: string,
  content: string,
  root = ROOT,
  skillNames: Set<string> = new Set()
): Problem[] {
  const file = relative(root, path).replaceAll("\\", "/")
  const problems: Problem[] = []
  const error = (message: string) =>
    problems.push({ file, level: "error", message })

  const parsed = parseFrontmatter(content)
  if ("error" in parsed) {
    error(parsed.error)
    return problems
  }
  const { data, body } = parsed

  for (const key of Object.keys(data)) {
    if (!AGENT_KEYS.has(key)) {
      error(`unknown frontmatter key "${key}" (Claude Code would ignore it)`)
    }
  }

  const stem = basename(path, ".md")
  if (typeof data.name !== "string" || !NAME.test(data.name)) {
    error("`name` is required: lowercase letters, digits and hyphens")
  } else if (data.name !== stem) {
    error(`\`name\` "${data.name}" must match the file name "${stem}"`)
  }

  if (typeof data.description !== "string" || data.description.trim() === "") {
    error("`description` is required (it decides when Claude delegates)")
  } else if (data.description.length > 1024) {
    error("`description` is over 1024 characters; move detail into the body")
  }

  const tools = toList(data.tools)
  if (data.tools !== undefined && tools.length === 0) {
    error("`tools` can't be empty; omit it to inherit all tools")
  }
  for (const tool of tools) {
    const base = tool.replace(/\(.*\)$/, "")
    if (!KNOWN_TOOLS.has(base) && !base.startsWith("mcp__")) {
      error(`unknown tool "${tool}"`)
    }
  }

  if (data.model !== undefined) {
    const model = String(data.model)
    if (!MODELS.has(model) && !model.startsWith("claude-")) {
      error(
        `\`model\` "${model}" must be sonnet, opus, haiku, fable, inherit or a claude-* id`
      )
    }
  }
  if (data.color !== undefined && !COLORS.has(String(data.color))) {
    error(`\`color\` "${String(data.color)}" isn't a supported color`)
  }

  for (const skill of toList(data.skills)) {
    if (!skillNames.has(skill)) error(`preloads unknown skill "${skill}"`)
  }

  // Reviewers must be read-only: no write tools, and Bash only with the
  // read-only git hook.
  if (stem.endsWith("-reviewer")) {
    if (tools.length === 0) {
      error("reviewers must list `tools` explicitly (read-only)")
    }
    for (const tool of tools.filter((t) => WRITE_TOOLS.includes(t))) {
      error(`reviewers must be read-only; remove "${tool}"`)
    }
    if (
      tools.includes("Bash") &&
      !JSON.stringify(data.hooks ?? {}).includes("readonly-bash.ts")
    ) {
      error("reviewer has Bash without the readonly-bash.ts PreToolUse hook")
    }
  }

  for (const script of missingHookScripts(data.hooks, root)) {
    error(`hook script ${script} doesn't exist`)
  }

  if (body.trim().length < 200) {
    error("the body (system prompt) is too short to guide the agent")
  }

  return problems
}

export function validateRule(
  path: string,
  content: string,
  root = ROOT
): Problem[] {
  const file = relative(root, path).replaceAll("\\", "/")
  if (!content.startsWith("---")) return []
  const parsed = parseFrontmatter(content)
  if ("error" in parsed)
    return [{ file, level: "error", message: parsed.error }]
  const problems: Problem[] = []
  for (const key of Object.keys(parsed.data)) {
    if (key !== "paths") {
      problems.push({
        file,
        level: "warning",
        message: `rules only read \`paths\`; "${key}" is ignored`,
      })
    }
  }
  const globs = toList(parsed.data.paths)
  if (parsed.data.paths !== undefined && globs.length === 0) {
    problems.push({ file, level: "error", message: "`paths` is empty" })
  }
  for (const glob of globs) {
    const matcher = new Bun.Glob(glob)
    let matched = false
    for (const _ of matcher.scanSync({ cwd: root, onlyFiles: true })) {
      matched = true
      break
    }
    if (!matched) {
      problems.push({
        file,
        level: "warning",
        message: `paths glob "${glob}" matches no files (yet?)`,
      })
    }
  }
  return problems
}

/** `.agents/skills` must resolve to `.claude/skills`; see AGENTS.md. */
export function validateSkillsLink(root = ROOT): Problem[] {
  const file = ".agents/skills"
  const link = join(root, ".agents", "skills")
  const target = join(root, ".claude", "skills")
  let stat
  try {
    stat = lstatSync(link)
  } catch {
    return [
      {
        file,
        level: "warning",
        message:
          "missing: tools that read .agents/skills won't see the skills. See docs/runbooks/agent-skills-link.md",
      },
    ]
  }
  if (stat.isFile()) {
    return [
      {
        file,
        level: "error",
        message:
          "is a plain file, not a link: git checked the symlink out with core.symlinks=false. See docs/runbooks/agent-skills-link.md",
      },
    ]
  }
  if (stat.isSymbolicLink()) {
    try {
      if (realpathSync(link) === realpathSync(target)) return []
    } catch {
      // Broken link; reported below.
    }
    return [
      {
        file,
        level: "error",
        message: "link doesn't resolve to .claude/skills",
      },
    ]
  }
  return [
    {
      file,
      level: "error",
      message:
        "is a real directory (a copy will drift); replace it with a link to ../.claude/skills",
    },
  ]
}

export function validateRepo(root = ROOT): Problem[] {
  const problems: Problem[] = []
  const skillsDir = join(root, ".claude", "skills")
  const skillNames = new Set<string>()

  if (existsSync(skillsDir)) {
    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const dir = join(skillsDir, entry.name)
      const skillFile = join(dir, "SKILL.md")
      if (!existsSync(skillFile)) {
        problems.push({
          file: relative(root, dir).replaceAll("\\", "/"),
          level: "error",
          message: "skill folder has no SKILL.md",
        })
        continue
      }
      skillNames.add(entry.name)
      problems.push(
        ...validateSkill(dir, readFileSync(skillFile, "utf8"), root)
      )
    }
  }

  const agentsDir = join(root, ".claude", "agents")
  if (existsSync(agentsDir)) {
    for (const path of new Bun.Glob("**/*.md").scanSync({ cwd: agentsDir })) {
      const full = join(agentsDir, path)
      problems.push(
        ...validateAgent(full, readFileSync(full, "utf8"), root, skillNames)
      )
    }
  }

  const rulesDir = join(root, ".claude", "rules")
  if (existsSync(rulesDir)) {
    for (const path of new Bun.Glob("**/*.md").scanSync({ cwd: rulesDir })) {
      const full = join(rulesDir, path)
      problems.push(...validateRule(full, readFileSync(full, "utf8"), root))
    }
  }

  const settingsPath = join(root, ".claude", "settings.json")
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as {
        hooks?: unknown
      }
      for (const script of missingHookScripts(settings.hooks, root)) {
        problems.push({
          file: ".claude/settings.json",
          level: "error",
          message: `hook script ${script} doesn't exist`,
        })
      }
    } catch (error) {
      problems.push({
        file: ".claude/settings.json",
        level: "error",
        message: `invalid JSON: ${String(error)}`,
      })
    }
  }

  const claudeMd = join(root, "CLAUDE.md")
  if (!existsSync(join(root, "AGENTS.md"))) {
    problems.push({ file: "AGENTS.md", level: "error", message: "missing" })
  }
  if (
    !existsSync(claudeMd) ||
    !/^@AGENTS\.md\s*$/m.test(readFileSync(claudeMd, "utf8"))
  ) {
    problems.push({
      file: "CLAUDE.md",
      level: "error",
      message: "must import AGENTS.md with a line `@AGENTS.md`",
    })
  }

  problems.push(...validateSkillsLink(root))
  return problems
}

if (import.meta.main) {
  const problems = validateRepo()
  const errors = problems.filter((p) => p.level === "error")
  const inCi = process.env.GITHUB_ACTIONS === "true"
  for (const p of problems) {
    if (inCi) {
      console.log(`::${p.level} file=${p.file}::${p.message}`)
    } else {
      console.log(`${p.level === "error" ? "✖" : "⚠"} ${p.file}: ${p.message}`)
    }
  }
  console.log(
    `\n${errors.length} error(s), ${problems.length - errors.length} warning(s)`
  )
  process.exit(errors.length > 0 ? 1 : 0)
}
