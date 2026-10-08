import { describe, expect, it } from "vitest"

import { buildMcpConfigs } from "@/features/settings/utils/mcp-configs"

const URL = "https://usetusk.dev/api/mcp"
const TOKEN = "tsk_secret"

describe("buildMcpConfigs", () => {
  it("gives Cursor a server with the token in its headers", () => {
    const { cursor } = buildMcpConfigs(URL, TOKEN)

    expect(JSON.parse(cursor.code)).toEqual({
      mcpServers: {
        tusk: { url: URL, headers: { Authorization: "Bearer tsk_secret" } },
      },
    })
  })

  it("sends Claude Desktop through mcp-remote with the header from env", () => {
    const desktop = JSON.parse(
      buildMcpConfigs(URL, TOKEN)["claude-desktop"].code
    )

    expect(desktop.mcpServers.tusk.args).toEqual([
      "-y",
      "mcp-remote",
      URL,
      "--header",
      "Authorization:${TUSK_AUTH}",
    ])
    expect(desktop.mcpServers.tusk.env).toEqual({
      TUSK_AUTH: "Bearer tsk_secret",
    })
  })

  it("writes Codex's TOML with the url and header", () => {
    expect(buildMcpConfigs(URL, TOKEN).codex.code).toBe(
      [
        "[mcp_servers.tusk]",
        `url = "${URL}"`,
        'http_headers = { "Authorization" = "Bearer tsk_secret" }',
      ].join("\n")
    )
  })
})
