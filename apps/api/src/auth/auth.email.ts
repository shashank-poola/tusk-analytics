import type { Bindings } from "../config/env"

const RESEND_API_URL = "https://api.resend.com/emails"

type EmailEnv = Pick<Bindings, "RESEND_API_KEY" | "EMAIL_FROM">

export async function sendMagicLinkEmail(
  env: EmailEnv,
  { to, url }: { to: string; url: string }
): Promise<void> {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject: "Sign in to Viewtally",
      text: `Sign in to Viewtally:\n\n${url}\n\nThis link expires in 5 minutes. If you didn't ask for it, ignore this email.`,
      html: `<p><a href="${escapeHtml(url)}">Sign in to Viewtally</a></p><p>This link expires in 5 minutes. If you didn't ask for it, ignore this email.</p>`,
    }),
  })

  if (!response.ok) {
    console.error(
      `Resend rejected the magic-link email (${response.status}):`,
      await response.text()
    )
    throw new Error("Failed to send the sign-in email")
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}
