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
