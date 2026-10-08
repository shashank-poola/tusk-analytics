import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { McpSetup } from "@/features/settings/components/mcp-setup"

const URL = "https://usetusk.dev/api/mcp"

describe("McpSetup", () => {
  it("starts on Claude Code with its command", () => {
    render(<McpSetup url={URL} token="tsk_secret" />)

    expect(screen.getByRole("tab", { name: "Claude Code" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(
      screen.getByText(/claude mcp add --transport http tusk/)
    ).toHaveTextContent("Authorization: Bearer tsk_secret")
  })

  it("shows each client's config file on its tab", async () => {
    render(<McpSetup url={URL} token="tsk_secret" />)

    await userEvent.click(screen.getByRole("tab", { name: "Cursor" }))
    expect(screen.getByText("~/.cursor/mcp.json")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("tab", { name: "Codex" }))
    expect(screen.getByText("~/.codex/config.toml")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("tab", { name: "Claude Desktop" }))
    expect(screen.getByText(/mcp-remote/)).toBeInTheDocument()
  })
})
