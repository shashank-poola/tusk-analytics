"use client"

import Link from "next/link"
import { useState } from "react"

import { LogoMark } from "@/components/brand/logo"
import { signInErrorMessage } from "@/lib/auth-errors"
import { routes } from "@/lib/routes"

import { AuthButton } from "./auth-button"
import { EmailForm } from "./email-form"
import { GoogleButton } from "./google-button"

type SignInProps = {
  /** The `?error=` code Better Auth adds when a sign-in attempt fails. */
  errorCode?: string
}

/** The dark half of the sign-in page. */
export function SignIn({ errorCode }: SignInProps) {
  const [error, setError] = useState(
    errorCode ? signInErrorMessage(errorCode) : null
  )
  const [sentTo, setSentTo] = useState<string | null>(null)

  return (
    <div className="w-full max-w-76 text-center">
      <LogoMark className="mx-auto size-16 lg:hidden" />
      <h1 className="mt-5 text-[1.75rem] leading-tight">Welcome to Tusk</h1>

      {sentTo ? (
        <>
          <p className="mt-2 text-[15px] text-muted-foreground">
            We sent a sign-in link to{" "}
            <span className="text-foreground">{sentTo}</span>. It expires in 5
            minutes.
          </p>
          <AuthButton
            type="button"
            variant="secondary"
            className="mt-6"
            onClick={() => setSentTo(null)}
          >
            Use a different email
          </AuthButton>
        </>
      ) : (
        <>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Sign in or create your account to get started.
          </p>
          <div className="mt-6 space-y-2.5">
            <GoogleButton onError={setError} />
            <Divider />
            <EmailForm onSent={setSentTo} onError={setError} />
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 text-xs text-negative">
          {error}
        </p>
      )}

      <p className="mt-6 text-[0.6875rem] text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link
          href={routes.terms}
          className="font-medium text-foreground underline"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href={routes.privacy}
          className="font-medium text-foreground underline"
        >
          Privacy Notice
        </Link>
        .
      </p>
    </div>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 py-1 text-[0.6875rem] text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
