import type { Device } from "@workspace/db"
import UAParser from "ua-parser-js"

type ParsedUserAgent = {
  browser: string | null
  os: string | null
  device: Device
}

// ua-parser-js name → stored slug, one per icon in apps/web/public/icons.
// Anything else is stored as null: rare names captured from the user agent
// would narrow a visitor down next to their city.
const BROWSERS: Record<string, string> = {
  Chrome: "chrome",
  "Mobile Chrome": "chrome",
  "Chrome WebView": "chrome",
  Firefox: "firefox",
  "Mobile Firefox": "firefox",
  Safari: "safari",
  "Mobile Safari": "safari",
  Edge: "edge",
  Opera: "opera",
  Brave: "brave",
  "Samsung Internet": "samsung-internet",
}

const SYSTEMS: Record<string, string> = {
  Windows: "windows",
  "Mac OS": "macos",
  Linux: "linux",
  Android: "android",
  iOS: "ios",
  Ubuntu: "ubuntu",
}

function slugFrom(table: Record<string, string>, name: string | undefined) {
  // hasOwn: a parsed name like "constructor" must not hit Object.prototype.
  return name && Object.hasOwn(table, name) ? (table[name] ?? null) : null
}

// Plenty for browser and OS tokens, and bounds the parser's regex work.
const MAX_PARSED_LENGTH = 256

// Not ua-parser-js's device list: one of its patterns backtracks
// polynomially (~70 ms of CPU for a crafted 500-char user agent) on this
// public endpoint.
function deviceOf(userAgent: string): Device {
  if (/iPad|Tablet/.test(userAgent)) return "tablet"
  // Android tablets leave "Mobile" out of the user agent.
  if (/Android/.test(userAgent) && !/Mobile/.test(userAgent)) return "tablet"
  if (/Mobi|iPhone|iPod/.test(userAgent)) return "mobile"
  return "desktop"
}

/**
 * Browser, OS and device as lowercase slugs (`chrome`, `macos`, `mobile`)
 * that name the dashboard's icon files. Desktop Brave sends Chrome's user
 * agent, so it is counted as Chrome.
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const parser = new UAParser(userAgent.slice(0, MAX_PARSED_LENGTH))
  return {
    browser: slugFrom(BROWSERS, parser.getBrowser().name),
    os: slugFrom(SYSTEMS, parser.getOS().name),
    device: deviceOf(userAgent),
  }
}
