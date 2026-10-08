"use client"

import {
  API_TOKEN_NAME_MAX_LENGTH,
  API_TOKEN_PREFIX,
  type ApiToken,
  MAX_API_TOKENS_PER_USER,
} from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { BUTTON_CLASSES, INPUT_CLASSES } from "@/components/ui/button-styles"

import {
  createApiTokenAction,
  revokeApiTokenAction,
} from "@/features/settings/server/api-token-actions"
import { McpSetup } from "./mcp-setup"

type ApiTokensProps = {
  /** Null when they couldn't be loaded. */
  tokens: ApiToken[] | null
  /** The MCP server's address, shown in every client's config. */
  mcpUrl: string
}

// Fixed locale and zone, so the server and the browser render the same text.
const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

/**
 * Create, list and revoke account tokens, and the MCP setup for each AI
 * client. A new token's secret is shown once, filled into the setup.
 */
export function ApiTokens({ tokens, mcpUrl }: ApiTokensProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [secret, setSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const full = (tokens?.length ?? 0) >= MAX_API_TOKENS_PER_USER

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const result = await createApiTokenAction({ name })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setName("")
    setSecret(result.secret)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} noValidate className="space-y-2">
        <label htmlFor="api-token-name" className="text-sm font-medium">
          Token name
        </label>
        <div className="flex max-w-md gap-2">
          <input
            id="api-token-name"
            value={name}
            placeholder="Claude Code"
            maxLength={API_TOKEN_NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby="api-token-error"
            className={cn(INPUT_CLASSES, "min-w-0 flex-1")}
          />
          <button
            type="submit"
            disabled={pending || full}
            className={cn(BUTTON_CLASSES.primary, "shrink-0")}
          >
            {pending ? "Creating…" : "Create token"}
          </button>
        </div>
        <p id="api-token-error" className="min-h-5 text-xs" aria-live="polite">
          {error && (
            <span role="alert" className="text-negative">
              {error}
            </span>
          )}
          {!error && full && (
            <span className="text-muted-foreground">
              You have {MAX_API_TOKENS_PER_USER} tokens. Revoke one to create
              another.
            </span>
          )}
        </p>
      </form>

      {secret && (
        <p
          role="status"
          className="rounded-xl border-2 border-accent/40 bg-accent-soft px-3.5 py-2.5 text-sm"
        >
          Token created. Copy the setup below now: Tusk shows the token only
          once.
        </p>
      )}

      <McpSetup url={mcpUrl} token={secret ?? `${API_TOKEN_PREFIX}…`} />

      {tokens === null && (
        <p role="alert" className="text-sm text-negative">
          Couldn&apos;t load your tokens. Reload the page to try again.
        </p>
      )}
      {tokens && tokens.length > 0 && (
        <ul className="divide-y-2 divide-border rounded-xl border-2 border-border">
          {tokens.map((token) => (
            <TokenRow key={token.id} token={token} />
          ))}
        </ul>
      )}
    </div>
  )
}

function TokenRow({ token }: { token: ApiToken }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function revoke() {
    const result = await revokeApiTokenAction(token.id)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{token.name}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono">{token.prefix}…</span> · Created{" "}
          {DATE.format(new Date(token.createdAt))} ·{" "}
          {token.lastUsedAt
            ? `Last used ${DATE.format(new Date(token.lastUsedAt))}`
            : "Never used"}
        </p>
        {error && (
          <p role="alert" className="text-xs text-negative">
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={confirming ? revoke : () => setConfirming(true)}
        onBlur={() => setConfirming(false)}
        aria-label={
          confirming ? `Confirm revoking ${token.name}` : `Revoke ${token.name}`
        }
        className="min-h-11 rounded-lg px-2.5 text-sm font-semibold text-negative hover:bg-negative/10 sm:min-h-8"
      >
        {confirming ? "Revoke for good?" : "Revoke"}
      </button>
    </li>
  )
}
