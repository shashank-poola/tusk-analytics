import {
  type BreakdownBy,
  type Channel,
  channelSchema,
  knownSourceName,
} from "@workspace/contracts"

import { LOCALE } from "./format"

// Human names for breakdown keys. Keys are tracker input: these functions
// only map them to text, and anything unknown is shown as stored.

// Display names for the slugs ingest stores (user-agent.ts). Unknown slugs
// are shown as stored.
const BROWSER_NAMES: Record<string, string> = {
  chrome: "Chrome",
  firefox: "Firefox",
  safari: "Safari",
  edge: "Edge",
  opera: "Opera",
  brave: "Brave",
  "samsung-internet": "Samsung Internet",
}

const OS_NAMES: Record<string, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  android: "Android",
  ios: "iOS",
  ubuntu: "Ubuntu",
}

const CHANNEL_NAMES: Record<Channel, string> = {
  direct: "Direct",
  search: "Organic search",
  social: "Social",
  ai: "AI assistants",
  email: "Email",
  paid: "Paid",
  referral: "Referral",
}

/** What a missing key means for each dimension. */
const MISSING_LABELS: Partial<Record<BreakdownBy, string>> = {
  referrer: "Direct/None",
  campaign: "No campaign",
}

const DEVICE_NAMES: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
}

const regionNames = new Intl.DisplayNames(LOCALE, { type: "region" })

/** "IN" → "India"; an unknown code is shown as stored. */
function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code
  } catch {
    // Not a well-formed region code.
    return code
  }
}

export function countryLabel(code: string | null): string {
  return code ? countryName(code) : "Unknown"
}

/** The name to show for a breakdown key; "Unknown" when it's missing. */
export function keyLabel(by: BreakdownBy, key: string | null): string {
  if (key === null || key === "") return MISSING_LABELS[by] ?? "Unknown"
  switch (by) {
    case "source":
      return sourceLabel(key)
    case "channel": {
      const channel = channelSchema.safeParse(key)
      return channel.success ? CHANNEL_NAMES[channel.data] : key
    }
    case "country":
      return countryName(key)
    case "device":
      return DEVICE_NAMES[key] ?? key
    case "browser":
      return browserLabel(key)
    case "os":
      return osLabel(key)
    case "page":
    case "entry_page":
    case "exit_page":
    case "referrer":
    case "campaign":
    case "region":
    case "city":
    case "hostname":
    case "exit_link":
      return key
  }
}

/** DataFast's wording: no referrer and no tag is "Direct/None". */
export function sourceLabel(key: string | null): string {
  if (!key) return "Unknown"
  if (key === "direct") return "Direct/None"
  return knownSourceName(key) ?? key
}

export function browserLabel(key: string): string {
  return BROWSER_NAMES[key] ?? key
}

export function osLabel(key: string): string {
  return OS_NAMES[key] ?? key
}

export function deviceLabel(key: string | null): string {
  if (!key) return "Unknown"
  return DEVICE_NAMES[key] ?? key
}
