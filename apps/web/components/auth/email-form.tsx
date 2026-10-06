"use client"

import { type FormEvent, useState } from "react"

import { requestErrorMessage } from "@/lib/auth-errors"
import { authClient } from "@/lib/auth-client"
import { routes } from "@/lib/routes"

import { AuthButton } from "./auth-button"

type EmailFormProps = {
  onSent: (email: string) => void
  onError: (message: string | null) => void
}

/** Sends a magic link. New emails get an account when they first sign in. */
export function EmailForm({ onSent, onError }: EmailFormProps) {
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    onError(null)

    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: routes.dashboard,
      errorCallbackURL: routes.signIn,
    })
    setPending(false)

    if (error) onError(requestErrorMessage(error))
    else onSent(email.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@company.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="h-11 w-full rounded-full border border-border bg-transparent px-5 text-center text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/50 focus:outline-none sm:h-10"
      />
      <AuthButton type="submit" variant="outline" disabled={pending}>
        {pending ? "Sending link…" : "Continue with email"}
      </AuthButton>
    </form>
  )
}
