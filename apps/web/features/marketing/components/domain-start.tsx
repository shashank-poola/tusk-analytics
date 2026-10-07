"use client"

import { domainSchema } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useId, useState } from "react"
import { preconnect } from "react-dom"

import { BUTTON_CLASSES, INPUT_CLASSES } from "@/components/ui/button-styles"
import { Icon } from "@/components/ui/icon"
import { routes } from "@/lib/routes"
import {
  SIGNUP_DOMAIN_COOKIE,
  SIGNUP_DOMAIN_MAX_AGE_SECONDS,
} from "@/lib/signup-domain"

const FAVICON_ORIGIN = "https://www.google.com"

/**
 * "yoursite.com" plus the start button. The site's icon swaps in on the
 * keystroke that makes the domain valid: well-known sources from our own
 * SVGs, anything else from Google's favicon service (connected ahead of
 * time). The domain rides along to onboarding in a short-lived cookie.
 */
export function DomainStart() {
  const router = useRouter()
  const id = useId()
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  // Warms the connection, so the first favicon arrives sooner.
  preconnect(FAVICON_ORIGIN)

  const parsed = domainSchema.safeParse(value)
  const host = parsed.success ? parsed.data : null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Enter a domain like myapp.com"
      )
      return
    }
    const secure = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `${SIGNUP_DOMAIN_COOKIE}=${encodeURIComponent(parsed.data)}; Max-Age=${SIGNUP_DOMAIN_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`
    router.push(routes.signIn)
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto mt-10 w-full max-w-xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor={`${id}-domain`} className="sr-only">
            Your website
          </label>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-4 grid place-items-center"
          >
            {host ? (
              <Icon type="referrer" name={host} className="size-5" />
            ) : (
              <Globe className="size-5 text-muted-foreground" />
            )}
          </span>
          <input
            id={`${id}-domain`}
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="yourwebsite.com"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setError(null)
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : `${id}-note`}
            className={cn(INPUT_CLASSES, "h-12 pl-12 text-base")}
          />
        </div>
        <button
          type="submit"
          className={cn(BUTTON_CLASSES.primary, "h-12 shrink-0")}
        >
          Start tracking free
        </button>
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-3 text-[13px] text-negative"
        >
          {error}
        </p>
      ) : (
        <p id={`${id}-note`} className="mt-3 text-[13px] text-muted-foreground">
          Free during beta. No credit card needed.
        </p>
      )}
    </form>
  )
}
