"use client"

import { useState } from "react"

import { requestErrorMessage } from "@/lib/auth-errors"
import { authClient } from "@/lib/auth-client"
import { routes } from "@/lib/routes"

import { AuthButton } from "./auth-button"

type GoogleButtonProps = {
  onError: (message: string | null) => void
}

export function GoogleButton({ onError }: GoogleButtonProps) {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    onError(null)

    // On success the client sends the browser to Google, so there is nothing
    // to reset here.
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: routes.dashboard,
      errorCallbackURL: routes.signIn,
    })
    if (error) {
      onError(requestErrorMessage(error))
      setPending(false)
    }
  }

  return (
    <AuthButton type="button" onClick={handleClick} disabled={pending}>
      <GoogleIcon />
      Continue with Google
    </AuthButton>
  )
}

// Google's sign-in branding rules require its own logo colours.
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
      />
    </svg>
  )
}
