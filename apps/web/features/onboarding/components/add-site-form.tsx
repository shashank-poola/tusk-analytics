"use client"

import { createSiteInputSchema } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowRight } from "lucide-react"
import { type FormEvent, useState, useTransition } from "react"
import * as z from "zod"

import { BUTTON_CLASSES, INPUT_CLASSES } from "@/components/ui/button-styles"
import { DomainFavicon } from "@/components/ui/domain-favicon"

import {
  addSite,
  type AddSiteErrors,
} from "@/features/onboarding/server/add-site-action"
import { useLocalTime } from "@/features/onboarding/hooks/use-local-time"
import { useTimezoneOptions } from "@/features/onboarding/hooks/use-timezone-options"

type AddSiteFormProps = {
  /** Typed on the landing page before sign-in. */
  defaultDomain?: string
}

/**
 * Domain and time zone. The site's icon appears in the field as soon as
 * the domain is valid, and the time zone shows its clock right now, so
 * the choice is easy to check.
 */
export function AddSiteForm({ defaultDomain = "" }: AddSiteFormProps) {
  const [domain, setDomain] = useState(defaultDomain)
  const { defaultTimezone, timezones } = useTimezoneOptions()
  const [chosenTimezone, setChosenTimezone] = useState<string | null>(null)
  const timezone = chosenTimezone ?? defaultTimezone
  const localTime = useLocalTime(timezone)
  const [errors, setErrors] = useState<AddSiteErrors>({})
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = createSiteInputSchema.safeParse({ domain, timezone })
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error)
      setErrors({
        domain: fieldErrors.domain?.[0],
        timezone: fieldErrors.timezone?.[0],
      })
      return
    }

    setErrors({})
    startTransition(async () => {
      // Only returns on failure; on success the action redirects.
      setErrors(await addSite({ domain, timezone }))
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label htmlFor="domain" className="text-[15px] font-semibold">
          Domain
        </label>
        <div className="relative mt-1.5">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center"
          >
            <DomainFavicon value={domain} className="size-5" />
          </span>
          <input
            id="domain"
            name="domain"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="myapp.com"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            aria-invalid={errors.domain ? true : undefined}
            aria-describedby={errors.domain ? "domain-error" : "domain-hint"}
            className={cn(FIELD_CLASSES, "pl-11")}
          />
        </div>
        <FieldMessage id="domain" error={errors.domain}>
          Paste your site&apos;s address. We keep only the domain.
        </FieldMessage>
      </div>

      <div>
        <label htmlFor="timezone" className="text-[15px] font-semibold">
          Time zone
        </label>
        <select
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(event) => setChosenTimezone(event.target.value)}
          aria-invalid={errors.timezone ? true : undefined}
          aria-describedby={
            errors.timezone ? "timezone-error" : "timezone-hint"
          }
          className={cn(FIELD_CLASSES, "mt-1.5")}
        >
          {timezones.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <FieldMessage id="timezone" error={errors.timezone}>
          {localTime ? `It's ${localTime} there. ` : ""}Your days start at
          midnight in this time zone.
        </FieldMessage>
      </div>

      {errors.form && (
        <p role="alert" className="text-sm text-negative">
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(BUTTON_CLASSES.primary, "w-full")}
      >
        {pending ? "Adding site…" : "Add site"}
        {!pending && <ArrowRight aria-hidden="true" className="size-4" />}
      </button>
    </form>
  )
}

const FIELD_CLASSES = cn(INPUT_CLASSES, "aria-invalid:border-negative")

function FieldMessage({
  id,
  error,
  children,
}: {
  id: string
  error: string | undefined
  children: React.ReactNode
}) {
  if (error) {
    return (
      <p
        id={`${id}-error`}
        role="alert"
        className="mt-1.5 text-sm text-negative"
      >
        {error}
      </p>
    )
  }
  return (
    <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted-foreground">
      {children}
    </p>
  )
}
