"use client"

import { createSiteInputSchema } from "@workspace/contracts"
import { type FormEvent, useState, useTransition } from "react"
import { cn } from "@workspace/ui/lib/utils"
import * as z from "zod"

import { BUTTON_CLASSES, INPUT_CLASSES } from "@/components/ui/button-styles"

import {
  addSite,
  type AddSiteErrors,
} from "@/features/onboarding/server/add-site-action"
import { useTimezoneOptions } from "@/features/onboarding/hooks/use-timezone-options"

type AddSiteFormProps = {
  /** Typed on the landing page before sign-in. */
  defaultDomain?: string
}

export function AddSiteForm({ defaultDomain = "" }: AddSiteFormProps) {
  const [domain, setDomain] = useState(defaultDomain)
  const { defaultTimezone, timezones } = useTimezoneOptions()
  const [chosenTimezone, setChosenTimezone] = useState<string | null>(null)
  const timezone = chosenTimezone ?? defaultTimezone
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
    <form onSubmit={handleSubmit} noValidate className="max-w-md space-y-6">
      <div>
        <label htmlFor="domain" className="text-sm font-medium">
          Domain
        </label>
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
          className={FIELD_CLASSES}
        />
        <FieldMessage id="domain" error={errors.domain}>
          Paste your site&apos;s address. We keep only the domain.
        </FieldMessage>
      </div>

      <div>
        <label htmlFor="timezone" className="text-sm font-medium">
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
          className={FIELD_CLASSES}
        >
          {timezones.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <FieldMessage id="timezone" error={errors.timezone}>
          Days in your reports start at midnight in this time zone.
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
        className={BUTTON_CLASSES.primary}
      >
        {pending ? "Adding site…" : "Add site"}
      </button>
    </form>
  )
}

const FIELD_CLASSES = cn(INPUT_CLASSES, "mt-1.5 aria-invalid:border-negative")

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
