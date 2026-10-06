"use client"

import { Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { GoogleIcon } from "@/components/brand/google-icon"
import { accountErrorMessage } from "@/lib/auth-errors"
import { authClient } from "@/lib/auth-client"
import { routes } from "@/lib/routes"

type SignInMethodsProps = {
  email: string
  /** Better Auth account id of the linked Google account, if any. */
  googleAccountId: string | null
  /** All linked providers; the last one can't be disconnected. */
  linkedCount: number
}

/**
 * Google, the one social provider the API configures, plus the email link,
 * which always works for the account's address.
 */
export function SignInMethods({
  email,
  googleAccountId,
  linkedCount,
}: SignInMethodsProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connectGoogle() {
    setPending(true)
    setError(null)
    // On success the browser goes to Google and comes back here.
    const { error } = await authClient.linkSocial({
      provider: "google",
      callbackURL: routes.settings,
      errorCallbackURL: routes.settings,
    })
    if (error) {
      setError(accountErrorMessage(error))
      setPending(false)
    }
  }

  async function disconnectGoogle(accountId: string) {
    setPending(true)
    setError(null)
    const { error } = await authClient.unlinkAccount({ accountId })
    setPending(false)
    if (error) {
      setError(accountErrorMessage(error))
      return
    }
    router.refresh()
  }

  return (
    <div>
      <ul className="divide-y divide-border border-y border-border">
        <MethodRow
          icon={<GoogleIcon className="size-5" />}
          name="Google"
          detail={googleAccountId ? "Connected" : "Not connected"}
          action={
            googleAccountId ? (
              linkedCount > 1 ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => disconnectGoogle(googleAccountId)}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-negative disabled:opacity-50 sm:min-h-9"
                >
                  Disconnect
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Only provider
                </span>
              )
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={connectGoogle}
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 sm:min-h-9"
              >
                Connect
              </button>
            )
          }
        />
        <MethodRow
          icon={<Mail aria-hidden="true" className="size-5 text-accent" />}
          name="Email link"
          detail={`Always on: we send a one-time link to ${email}`}
          action={null}
        />
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-sm text-negative">
          {error}
        </p>
      )}
    </div>
  )
}

type MethodRowProps = {
  icon: React.ReactNode
  name: string
  detail: string
  action: React.ReactNode
}

function MethodRow({ icon, name, detail, action }: MethodRowProps) {
  return (
    <li className="flex items-center gap-4 py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {detail}
        </span>
      </span>
      {action}
    </li>
  )
}
