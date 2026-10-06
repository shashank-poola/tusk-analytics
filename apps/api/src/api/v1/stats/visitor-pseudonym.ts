// The visitors list never returns the tracker's cookie id: each visitor gets
// HMAC-SHA256(secret, "viewtally:visitor-pseudonym:v1:<siteId>:<visitorId>"),
// hex, cut to 24 characters (96 bits). The site id in the message makes the
// same browser look unrelated across two sites.
//
// The key is BETTER_AUTH_SECRET. The message's prefix separates this use from
// Better Auth's, so reusing the secret is safe. Rotating it only changes the
// pseudonyms, i.e. the dashboard's avatars and nicknames; nothing is stored.

const PSEUDONYM_LENGTH = 24
const encoder = new TextEncoder()

/** Imports the key once; the returned function signs one visitor id. */
export async function createVisitorPseudonymizer(
  secret: string,
  siteId: string
): Promise<(visitorId: string) => Promise<string>> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  return async (visitorId) => {
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`viewtally:visitor-pseudonym:v1:${siteId}:${visitorId}`)
    )
    return Array.from(new Uint8Array(signature), (byte) =>
      byte.toString(16).padStart(2, "0")
    )
      .join("")
      .slice(0, PSEUDONYM_LENGTH)
  }
}
