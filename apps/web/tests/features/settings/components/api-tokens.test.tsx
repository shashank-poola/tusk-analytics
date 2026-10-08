import type { ApiToken } from "@workspace/contracts"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiTokens } from "@/features/settings/components/api-tokens"

const { createApiTokenAction, revokeApiTokenAction, refresh } = vi.hoisted(
  () => ({
    createApiTokenAction: vi.fn(),
    revokeApiTokenAction: vi.fn(),
    refresh: vi.fn(),
  })
)

vi.mock("@/features/settings/server/api-token-actions", () => ({
  createApiTokenAction,
  revokeApiTokenAction,
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }))

const MCP_URL = "https://usetusk.dev/api/mcp"
const SECRET = `tsk_${"a".repeat(32)}`

const TOKEN: ApiToken = {
  id: "tok_3k9x2m7qpd4n8r1t",
  name: "Claude Code",
  prefix: "tsk_abcd1234",
  lastUsedAt: null,
  createdAt: "2026-10-08T10:00:00.000Z",
}

beforeEach(() => {
  createApiTokenAction.mockReset()
  revokeApiTokenAction.mockReset()
  refresh.mockReset()
})

describe("ApiTokens", () => {
  it("shows the Claude Code command with a placeholder before any token exists", () => {
    render(<ApiTokens tokens={[]} mcpUrl={MCP_URL} />)

    expect(
      screen.getByText(
        `claude mcp add --transport http tusk ${MCP_URL} --header "Authorization: Bearer tsk_…"`
      )
    ).toBeInTheDocument()
  })

  it("fills the new token into the setup, once", async () => {
    createApiTokenAction.mockResolvedValue({ ok: true, secret: SECRET })
    render(<ApiTokens tokens={[]} mcpUrl={MCP_URL} />)

    await userEvent.type(screen.getByLabelText("Token name"), "Claude Code")
    await userEvent.click(screen.getByRole("button", { name: "Create token" }))

    expect(createApiTokenAction).toHaveBeenCalledWith({ name: "Claude Code" })
    expect(screen.getByRole("status")).toHaveTextContent(/only once/)
    expect(screen.getByText(new RegExp(`Bearer ${SECRET}`))).toBeInTheDocument()
    expect(refresh).toHaveBeenCalled()
  })

  it("shows why a token couldn't be created", async () => {
    createApiTokenAction.mockResolvedValue({
      ok: false,
      error: "Give the token a name, like Claude Code",
    })
    render(<ApiTokens tokens={[]} mcpUrl={MCP_URL} />)

    await userEvent.click(screen.getByRole("button", { name: "Create token" }))

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Give the token a name, like Claude Code"
    )
  })

  it("lists tokens by name and prefix, never the secret", () => {
    render(<ApiTokens tokens={[TOKEN]} mcpUrl={MCP_URL} />)

    expect(
      screen.getByText("Claude Code", { selector: "p" })
    ).toBeInTheDocument()
    expect(screen.getByText("tsk_abcd1234…")).toBeInTheDocument()
    expect(screen.getByText(/Never used/)).toBeInTheDocument()
  })

  it("revokes a token after a second click", async () => {
    revokeApiTokenAction.mockResolvedValue({ ok: true })
    render(<ApiTokens tokens={[TOKEN]} mcpUrl={MCP_URL} />)

    await userEvent.click(
      screen.getByRole("button", { name: "Revoke Claude Code" })
    )
    expect(revokeApiTokenAction).not.toHaveBeenCalled()
    await userEvent.click(
      screen.getByRole("button", { name: "Confirm revoking Claude Code" })
    )

    expect(revokeApiTokenAction).toHaveBeenCalledWith(TOKEN.id)
    expect(refresh).toHaveBeenCalled()
  })

  it("still offers setup when the tokens couldn't be loaded", () => {
    render(<ApiTokens tokens={null} mcpUrl={MCP_URL} />)

    expect(screen.getByRole("alert")).toHaveTextContent(/Couldn't load/)
    expect(screen.getByText(/claude mcp add/)).toBeInTheDocument()
  })

  it("stops creating at the token limit", () => {
    const tokens = Array.from({ length: 10 }, (_, i) => ({
      ...TOKEN,
      id: `tok_000000000000000${i}`,
    }))
    render(<ApiTokens tokens={tokens} mcpUrl={MCP_URL} />)

    expect(screen.getByRole("button", { name: "Create token" })).toBeDisabled()
  })
})
