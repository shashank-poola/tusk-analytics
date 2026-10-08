# MCP server

Tusk answers [Model Context Protocol](https://modelcontextprotocol.io) at
`/api/mcp`, so Claude Code, Cursor, Codex or Claude Desktop can read a
user's stats. Code: `apps/api/src/mcp/`.

## How it works

- **Auth:** read-only account tokens (`tsk_` + 32 characters), created in
  Settings → API & MCP and sent as `Authorization: Bearer tsk_…`. Only the
  SHA-256 is stored (`api_tokens`). A user can have 10 tokens.
- **Read-only:** `requireUserOrToken` lets a token make GET requests only.
  Routers opt in one by one (sites, stats, funnels); everything else, token
  management included, takes the session only (`requireUser`).
- **Transport:** Streamable HTTP, stateless, one JSON-RPC message per POST,
  JSON answers only. GET and DELETE answer 405 (no event stream, no
  sessions). Requests with a foreign `Origin` answer 403.
- **Tools** (`mcp.tools.ts`): each one is a GET on `/api/v1`, run in-process
  with the same token, so the API's validation, ownership checks (404 for
  other users' sites) and error messages apply unchanged.
- **Untrusted text:** referrers, campaigns, paths and goal names come from
  visitors. Answers start with a notice saying so, and `untrusted-text.ts`
  strips control and invisible characters and cuts strings at 200
  characters before they reach the model.

## Try it locally

1. `bun run dev`, sign in, and create a token in Settings → API & MCP.
2. `claude mcp add --transport http tusk http://localhost:8787/api/mcp --header "Authorization: Bearer tsk_…"`
3. Ask Claude Code "list my Tusk sites".

## Not yet

- Claude.ai and ChatGPT connectors need OAuth (Better Auth's MCP plugin).
- Rate limiting per token (a Workers rate limiting binding).
- Token expiry.
