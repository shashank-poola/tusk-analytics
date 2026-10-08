/** Where to paste each client's config; Claude Code takes a command. */
export type McpClient = "claude-code" | "cursor" | "codex" | "claude-desktop"

export type McpConfig = { label: string; code: string }

/**
 * Setup for each MCP client, with `token` filled in (or a placeholder).
 * Claude Desktop can't send headers to a remote server itself, so it goes
 * through mcp-remote; the header has no space after the colon because
 * Windows splits arguments on spaces.
 */
export function buildMcpConfigs(
  url: string,
  token: string
): Record<McpClient, McpConfig> {
  const header = `Bearer ${token}`
  return {
    "claude-code": {
      label: "Terminal",
      code: `claude mcp add --transport http tusk ${url} --header "Authorization: ${header}"`,
    },
    cursor: {
      label: "~/.cursor/mcp.json",
      code: JSON.stringify(
        {
          mcpServers: {
            tusk: { url, headers: { Authorization: header } },
          },
        },
        null,
        2
      ),
    },
    codex: {
      label: "~/.codex/config.toml",
      code: [
        "[mcp_servers.tusk]",
        `url = "${url}"`,
        `http_headers = { "Authorization" = "${header}" }`,
      ].join("\n"),
    },
    "claude-desktop": {
      label: "claude_desktop_config.json",
      code: JSON.stringify(
        {
          mcpServers: {
            tusk: {
              command: "npx",
              args: [
                "-y",
                "mcp-remote",
                url,
                "--header",
                "Authorization:${TUSK_AUTH}",
              ],
              env: { TUSK_AUTH: header },
            },
          },
        },
        null,
        2
      ),
    },
  }
}
