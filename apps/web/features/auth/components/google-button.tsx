"use client"

import { useState } from "react"

import { GoogleIcon } from "@/components/brand/google-icon"
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
