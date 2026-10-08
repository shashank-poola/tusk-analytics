// Referrers, campaigns, paths and goal names are sent by visitors' browsers
// (or by anyone posting to /collect), and an MCP answer goes straight into
// a model that may also run shell commands. Strip what can hide or reorder
// text and cut long values, so an injected "instruction" stays short and
// visible.

/** Long enough for any real referrer host, path or campaign name. */
export const MAX_MODEL_TEXT_LENGTH = 200

// C0 and C1 controls (newlines included), the soft hyphen, zero-width and
// invisible formatting characters, line and paragraph separators, bidi
// marks, overrides and isolates, and the byte-order mark.
const HIDDEN =
  /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g

function cleanText(text: string): string {
  const visible = text.replace(HIDDEN, " ")
  return visible.length > MAX_MODEL_TEXT_LENGTH
    ? `${visible.slice(0, MAX_MODEL_TEXT_LENGTH)}…`
    : visible
}

/** A copy of an API response with every string cleaned for a model. */
export function cleanForModel(value: unknown): unknown {
  if (typeof value === "string") return cleanText(value)
  if (Array.isArray(value)) return value.map(cleanForModel)
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cleanForModel(item)])
    )
  }
  return value
}
