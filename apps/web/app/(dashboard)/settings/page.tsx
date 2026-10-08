import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ApiTokens } from "@/features/settings/components/api-tokens"
import { AppearancePicker } from "@/features/settings/components/appearance-picker"
import { ProfileForm } from "@/features/settings/components/profile-form"
import { SignInMethods } from "@/features/settings/components/sign-in-methods"
import { findApiTokens } from "@/features/settings/server/api-tokens.queries"
import { accountErrorMessage } from "@/lib/auth-errors"
import { userAvatar } from "@/lib/avatar"
import { scriptUrl } from "@/lib/env"
import { routes } from "@/lib/routes"
import { getSession, listLinkedAccounts } from "@/lib/session"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage({
  searchParams,
}: PageProps<"/settings">) {
  const [session, accounts, tokens, { error }] = await Promise.all([
    getSession(),
    listLinkedAccounts(),
    findApiTokens(),
    searchParams,
  ])
  // The layout already checked; this narrows the type.
  if (!session) redirect(routes.signIn)

  const { user } = session
  const google = accounts.find((account) => account.providerId === "google")
  // Better Auth sends ?error=<code> back here when linking Google fails.
  const linkError =
    typeof error === "string"
      ? accountErrorMessage({ status: 400, code: error })
      : null

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl leading-tight">Settings</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Your account: who you sign in as, which providers can sign you in, which
        AI tools can read your stats, and how Tusk looks in this browser.
      </p>

      <Section title="Profile" description="How you show up in Tusk.">
        <ProfileForm
          name={user.name}
          email={user.email}
          avatarSrc={userAvatar(user)}
          hasProviderPhoto={Boolean(user.image)}
        />
      </Section>

      <Section
        title="Sign-in methods"
        description="Connecting a provider links it to this account by its verified email."
      >
        {linkError && (
          <p role="alert" className="mb-3 text-sm text-negative">
            {linkError}
          </p>
        )}
        <SignInMethods
          email={user.email}
          googleAccountId={google?.id ?? null}
          linkedCount={accounts.length}
        />
      </Section>

      <Section
        title="API & MCP"
        description="Let Claude, Cursor or Codex read your stats. Account tokens are read-only: they can't change or delete anything."
      >
        <ApiTokens
          tokens={tokens}
          mcpUrl={new URL("/api/mcp", scriptUrl()).href}
        />
      </Section>

      <Section
        title="Appearance"
        description="Choose how Tusk looks in this browser."
      >
        <AppearancePicker />
      </Section>

      <p className="mt-10 text-xs text-muted-foreground">
        Generated faces: “Micah” by Micah Lanier, licensed under{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className="underline underline-offset-2 hover:text-foreground"
        >
          CC BY 4.0
        </a>
        , via DiceBear.
      </p>
    </div>
  )
}

type SectionProps = {
  title: string
  description: string
  children: React.ReactNode
}

function Section({ title, description, children }: SectionProps) {
  const id = `settings-${title.toLowerCase().replace(/\W+/g, "-")}`
  return (
    <section
      aria-labelledby={id}
      className="mt-8 rounded-2xl border-2 border-border bg-surface p-5 sm:p-7"
    >
      <h2 id={id} className="text-lg leading-snug">
        {title}
      </h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  )
}
