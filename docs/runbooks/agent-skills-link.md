# The `.agents/skills` link

Skills live in `.claude/skills` (Claude Code reads them there). Other agent
tools read `.agents/skills`, so `.agents/skills` should be a symlink to
`../.claude/skills`: one copy, two readers.

`bun run validate:agents` reports the link's state:

- **missing**: warning. Only tools that read `.agents/skills` are affected.
- **plain file containing `../.claude/skills`**: error. Git checked the
  symlink out with `core.symlinks=false`, the Git for Windows default. Tools
  see a text file, not skills.
- **real directory**: error. A copy will drift from `.claude/skills`.

## Making it work on Windows

Requirements: Windows Developer Mode on (Settings → System → For
developers), which lets normal users create symlinks, and git told to use
real symlinks.

```powershell
git config --global core.symlinks true
# in the repo root:
New-Item -ItemType Directory -Force .agents | Out-Null
New-Item -ItemType SymbolicLink -Path .agents\skills -Target ..\.claude\skills
bun run validate:agents
```

If the link already exists as a plain text file after a clone or checkout,
delete that file and run the commands above. Git stores the link correctly
(mode `120000`) either way; `core.symlinks` only decides what checkout writes
on your disk.

Linux and macOS checkouts (including CI) get a real symlink with no setup.
