"use client"

import { useId, useState } from "react"

import { CodeBlock } from "@/components/ui/code-block"
import { TabList } from "@/components/ui/tab-list"

import {
  buildMcpConfigs,
  type McpClient,
} from "@/features/settings/utils/mcp-configs"

const TABS = [
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "codex", label: "Codex" },
  { id: "claude-desktop", label: "Claude Desktop" },
] as const satisfies readonly { id: McpClient; label: string }[]

type McpSetupProps = {
  /** The MCP server, e.g. `https://usetusk.dev/api/mcp`. */
  url: string
  /** The new token's secret, or a placeholder when none is on screen. */
  token: string
}

/** One tab per AI client, with its config ready to paste. */
export function McpSetup({ url, token }: McpSetupProps) {
  const id = useId()
  const [client, setClient] = useState<McpClient>("claude-code")
  const config = buildMcpConfigs(url, token)[client]

  return (
    <div className="space-y-3">
      <TabList
        label="AI client"
        tabs={TABS}
        active={client}
        onChange={(next) => setClient(next as McpClient)}
        idPrefix={id}
        stretch
      />
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${client}`}
        tabIndex={0}
        className="rounded-xl"
      >
        <CodeBlock label={config.label} code={config.code} />
      </div>
      <p className="text-xs text-muted-foreground">
        Then ask things like &ldquo;Where did my visitors come from this
        week?&rdquo; Claude.ai and ChatGPT connectors need sign-in with OAuth,
        which is coming next.
      </p>
      <p className="text-xs text-muted-foreground">
        Referrers and campaign names come from your visitors, so anyone can put
        text in them. Keep your AI tool asking before it runs commands while it
        reads Tusk data.
      </p>
    </div>
  )
}
