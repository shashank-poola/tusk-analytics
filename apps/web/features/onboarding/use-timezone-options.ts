import { useMemo, useSyncExternalStore } from "react"

const FALLBACK_TIMEZONE = "UTC"

const subscribeToNothing = () => () => {}

/**
 * Time zones for a select, preselecting the browser's. During server
 * rendering the browser's zone is unknown, so both return UTC there and the
 * server HTML matches the first client render.
 */
export function useTimezoneOptions(): {
  defaultTimezone: string
  timezones: string[]
} {
  const browserTimezone = useSyncExternalStore(
    subscribeToNothing,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null
  )
  const timezones = useMemo(
    () => timezoneOptions(browserTimezone),
    [browserTimezone]
  )
  return { defaultTimezone: browserTimezone ?? FALLBACK_TIMEZONE, timezones }
}

function timezoneOptions(browserTimezone: string | null): string[] {
  if (!browserTimezone) return [FALLBACK_TIMEZONE]

  // Some engines leave UTC or the detected zone out of this list.
  const zones = new Set(Intl.supportedValuesOf("timeZone"))
  zones.add(FALLBACK_TIMEZONE)
  zones.add(browserTimezone)
  return [...zones].sort()
}
