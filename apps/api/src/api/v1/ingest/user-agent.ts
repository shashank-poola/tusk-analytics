import type { Device } from "@workspace/db"

type ParsedUserAgent = {
  browser: string | null
  os: string | null
  device: Device
}

// Order matters: Edge and Opera also send "Chrome/", Chrome also sends
// "Safari/", and iOS sends "like Mac OS X".
const BROWSERS: [RegExp, string][] = [
  [/Edg(?:e|A|iOS)?\//, "Edge"],
  [/OPR\/|OPiOS\//, "Opera"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Version\/[\d.]+.*Safari\//, "Safari"],
]

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, "iOS"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Macintosh|Mac OS X/, "macOS"],
  [/Linux/, "Linux"],
]

function firstMatch(userAgent: string, table: [RegExp, string][]) {
  return table.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null
}

function deviceOf(userAgent: string): Device {
  if (/iPad|Tablet/.test(userAgent)) return "tablet"
  // Android tablets leave "Mobile" out of the user agent.
  if (/Android/.test(userAgent) && !/Mobile/.test(userAgent)) return "tablet"
  if (/Mobi|iPhone|iPod/.test(userAgent)) return "mobile"
  return "desktop"
}

/**
 * Buckets a user agent into browser, OS and device. A few regexes instead of
 * a parser library: this runs on every event and CPU time is billed. Unknown
 * browsers and systems come back as null.
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  return {
    browser: firstMatch(userAgent, BROWSERS),
    os: firstMatch(userAgent, SYSTEMS),
    device: deviceOf(userAgent),
  }
}
