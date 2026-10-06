import type { BreakdownBy } from "@workspace/contracts"

import { LOCALE } from "./format"

// Human names for breakdown keys. Keys are tracker input: these functions
// only map them to text, and anything unknown is shown as stored.

/** Display names for the channels ingest classifies (referrer-source.ts). */
const SOURCE_NAMES: Record<string, string> = {
  direct: "Direct",
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  x: "X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  hackernews: "Hacker News",
  github: "GitHub",
  producthunt: "Product Hunt",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
}

export type SourceKind =
  "direct" | "search" | "social" | "community" | "code" | "ai" | "other"

const SOURCE_KINDS: Record<string, SourceKind> = {
  direct: "direct",
  google: "search",
  bing: "search",
  duckduckgo: "search",
  x: "social",
  facebook: "social",
  linkedin: "social",
  reddit: "community",
  hackernews: "community",
  producthunt: "community",
  github: "code",
  chatgpt: "ai",
  perplexity: "ai",
}

const DEVICE_NAMES: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
}

const regionNames = new Intl.DisplayNames(LOCALE, { type: "region" })

export function sourceKind(key: string): SourceKind {
  return SOURCE_KINDS[key] ?? "other"
}

/** "IN" → "India"; an unknown code is shown as stored. */
function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code
  } catch {
    // Not a well-formed region code.
    return code
  }
}

/** "IN" → 🇮🇳, built from regional-indicator letters; null for anything else. */
export function countryFlag(code: string | null): string | null {
  if (!code || !/^[A-Z]{2}$/.test(code)) return null
  const REGIONAL_A = 0x1f1e6
  return String.fromCodePoint(
    ...[...code].map((letter) => REGIONAL_A + letter.charCodeAt(0) - 65)
  )
}

/** The name to show for a breakdown key; "Unknown" when it's missing. */
export function keyLabel(by: BreakdownBy, key: string | null): string {
  if (key === null || key === "") return "Unknown"
  switch (by) {
    case "source":
      return SOURCE_NAMES[key] ?? key
    case "country":
      return countryName(key)
    case "device":
      return DEVICE_NAMES[key] ?? key
    case "page":
    case "browser":
    case "os":
      return key
  }
}
