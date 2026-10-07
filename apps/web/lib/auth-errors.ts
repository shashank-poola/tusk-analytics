// Better Auth redirects back to the sign-in page with ?error=<code> when a
// magic link or Google sign-in fails.
const MESSAGES: Record<string, string> = {
  EXPIRED_TOKEN: "That sign-in link has expired. Request a new one.",
  INVALID_TOKEN: "That sign-in link is invalid or was already used.",
  access_denied: "Google sign-in was cancelled.",
}

const FALLBACK = "Sign-in failed. Please try again."

export function signInErrorMessage(code: string): string {
  return MESSAGES[code] ?? FALLBACK
}

/** For errors the auth client returns while sending a request. */
export function requestErrorMessage(error: { status: number }): string {
  if (error.status === 429) {
    return "Too many attempts. Wait a minute and try again."
  }
  return FALLBACK
}

// Codes Better Auth returns from account and profile requests on /settings.
const ACCOUNT_MESSAGES: Record<string, string> = {
  INVALID_NAME: "Enter a name of up to 80 characters.",
  FAILED_TO_UNLINK_LAST_ACCOUNT:
    "This is your only connected provider, so it can't be disconnected.",
  ACCOUNT_NOT_FOUND: "That provider is no longer connected. Refresh the page.",
  SOCIAL_ACCOUNT_ALREADY_LINKED:
    "That Google account is already linked to another Tusk account.",
}

export function accountErrorMessage(error: {
  status: number
  code?: string
}): string {
  if (error.status === 429) {
    return "Too many attempts. Wait a minute and try again."
  }
  return (
    (error.code && ACCOUNT_MESSAGES[error.code]) ??
    "That didn't work. Please try again."
  )
}
