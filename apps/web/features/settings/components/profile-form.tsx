"use client"

import { USER_NAME_MAX_LENGTH, userNameSchema } from "@workspace/contracts"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Avatar } from "@/components/ui/avatar"
import { accountErrorMessage } from "@/lib/auth-errors"
import { authClient } from "@/lib/auth-client"

type Status =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved" }
  | { state: "error"; message: string }

type ProfileFormProps = {
  name: string
  email: string
  avatarSrc: string
  /** True when the photo comes from the sign-in provider. */
  hasProviderPhoto: boolean
}

export function ProfileForm({
  name,
  email,
  avatarSrc,
  hasProviderPhoto,
}: ProfileFormProps) {
  const router = useRouter()
  const [value, setValue] = useState(name)
  const [status, setStatus] = useState<Status>({ state: "idle" })
  const unchanged = value.trim() === name.trim()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = userNameSchema.safeParse(value)
    if (!parsed.success) {
      setStatus({
        state: "error",
        message: parsed.error.issues[0]?.message ?? "Check your name.",
      })
      return
    }
    setStatus({ state: "saving" })
    const { error } = await authClient.updateUser({ name: parsed.data })
    if (error) {
      setStatus({ state: "error", message: accountErrorMessage(error) })
      return
    }
    setStatus({ state: "saved" })
    // The header shows the name too.
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <Avatar src={avatarSrc} className="size-16" />
      <div className="min-w-0 flex-1 space-y-5">
        <form onSubmit={handleSubmit} noValidate className="space-y-2">
          <label htmlFor="profile-name" className="text-sm font-medium">
            Name
          </label>
          <div className="flex max-w-md gap-2">
            <input
              id="profile-name"
              name="name"
              autoComplete="name"
              value={value}
              maxLength={USER_NAME_MAX_LENGTH}
              onChange={(event) => {
                setValue(event.target.value)
                setStatus({ state: "idle" })
              }}
              aria-invalid={status.state === "error" || undefined}
              aria-describedby="profile-name-status"
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm transition-colors outline-none focus-visible:border-accent sm:h-10"
            />
            <button
              type="submit"
              disabled={unchanged || status.state === "saving"}
              className="h-11 shrink-0 rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:h-10"
            >
              {status.state === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
          <p
            id="profile-name-status"
            className="min-h-5 text-xs"
            aria-live="polite"
          >
            {status.state === "saved" && (
              <span className="text-positive">Saved.</span>
            )}
            {status.state === "error" && (
              <span role="alert" className="text-negative">
                {status.message}
              </span>
            )}
          </p>
        </form>

        <div className="space-y-1">
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm">{email}</p>
          <p className="text-xs text-muted-foreground">
            Comes from how you sign in and can&apos;t be edited here.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          {hasProviderPhoto
            ? "Your photo comes from your Google profile."
            : "No profile photo yet, so here's a face of your own, generated just for you."}
        </p>
      </div>
    </div>
  )
}
