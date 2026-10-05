// Crockford base32 (lowercase): no i, l, o, u, so ids are easy to read aloud.
// 32 symbols divide 256 evenly, so `byte & 31` has no modulo bias.
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz"

/**
 * Prefixed random id, e.g. `createId("vt")` → `vt_3k9x2m7qpd4n8r1t`.
 * 16 characters = 80 bits of randomness.
 */
export function createId(prefix: string, length = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let id = ""
  for (const byte of bytes) id += ALPHABET.charAt(byte & 31)
  return `${prefix}_${id}`
}
