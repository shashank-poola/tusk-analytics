@AGENTS.md

## Claude Code only

- Hooks in `.claude/settings.json` run `bun` scripts from `.claude/scripts/`:
  Prettier after every edit, and blocks for dangerous shell commands, secret
  files and committed migrations. If a hook blocks you, don't work around it;
  tell the user what you wanted to do.
- Delegate reviews: `code-reviewer` after a change, `security-reviewer` for
  auth/webhooks/ingest/CORS, `d1-schema-reviewer` for anything under
  `packages/db`, `privacy-reviewer` for tracker or collected data.
- This is Windows: use forward slashes in paths you pass to tools, and don't
  rely on symlinks.
