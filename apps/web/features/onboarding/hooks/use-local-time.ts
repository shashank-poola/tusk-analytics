import { useMemo, useSyncExternalStore } from "react"

const TICK_MS = 15_000

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, TICK_MS)
  return () => clearInterval(timer)
}

/** A clock formatter for `timezone`, or null for a zone the browser doesn't know. */
function clockFormat(timezone: string): Intl.DateTimeFormat | null {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return null
  }
}

/**
 * The time right now in `timezone`, like "5:48 PM", kept current. Null
 * during server rendering (the server's clock and zone aren't the
 * visitor's) and for a zone the browser doesn't know. The formatter is
 * built once per zone; each tick only formats.
 */
export function useLocalTime(timezone: string): string | null {
  const format = useMemo(() => clockFormat(timezone), [timezone])
  return useSyncExternalStore(
    subscribe,
    () => format?.format(Date.now()) ?? null,
    () => null
  )
}
